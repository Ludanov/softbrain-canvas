import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  
  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}

const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;

const serverDirectus = createDirectus(directusUrl)
  .with(staticToken(directusToken))
  .with(rest());

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Find user in site_customers table
          const users = await serverDirectus.request(
            readItems('site_customers', {
              filter: { email: { _eq: credentials.email } }
            })
          );

          if (!users || users.length === 0) {
            throw new Error('Invalid email or password');
          }

          const user = users[0] as any;

          // Check if email is verified
          if (!user.email_verified) {
            throw new Error('Please verify your email before signing in');
          }

          // Check if account is active
          if (user.status !== 'active') {
            throw new Error('Your account is not active');
          }

          // Verify password
          const isPasswordValid = await compare(credentials.password, user.password_hash);
          
          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          // Return user object
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatar || null,
          };
        } catch (error: any) {
          console.error('Auth error:', error);
          throw new Error(error.message || 'Authentication failed');
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // If signing in with Google, create or update user in Directus
      if (account?.provider === 'google' && profile?.email) {
        try {
          // Check if user exists
          const existingUsers = await serverDirectus.request(
            readItems('site_customers', {
              filter: { email: { _eq: profile.email } }
            })
          );

          if (existingUsers && existingUsers.length > 0) {
            // User exists, update last login
            // Note: You might want to add a last_login field to track this
            return true;
          } else {
            // Create new user
            // Note: You'll need to implement user creation in Directus
            // For now, we'll allow the sign-in and handle user creation separately
            return true;
          }
        } catch (error) {
          console.error('Error checking/creating user:', error);
          return true; // Allow sign-in even if Directus sync fails
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
      }
      // Add access token to session for Drive API access
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }
      // Store access token and refresh token for Drive API
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      
      // Check if token is expired and refresh if needed
      if (token.expiresAt && typeof token.expiresAt === 'number') {
        const now = Math.floor(Date.now() / 1000);
        if (now > token.expiresAt - 300) { // Refresh 5 minutes before expiry
          console.log('Token expired, attempting refresh...');
          try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
                client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                grant_type: 'refresh_token',
                refresh_token: token.refreshToken as string,
              }),
            });
            
            if (response.ok) {
              const refreshed = await response.json();
              token.accessToken = refreshed.access_token;
              token.expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
              console.log('Token refreshed successfully');
            } else {
              console.error('Failed to refresh token:', await response.text());
            }
          } catch (error) {
            console.error('Error refreshing token:', error);
          }
        }
      }
      
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        domain: '.softbrain.space',
        secure: true,
        sameSite: 'lax',
        httpOnly: true,
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        domain: '.softbrain.space',
        secure: true,
        sameSite: 'lax',
        httpOnly: true,
      },
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
