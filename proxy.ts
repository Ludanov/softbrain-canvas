/**
 * Next.js Proxy (formerly Middleware)
 *
 * NOTE: In Next.js 16, the `middleware.ts` file convention is renamed to
 * `proxy.ts`. The deprecation warning treats `middleware.ts` as ignored.
 *
 * Handles:
 * 1. Internationalization (i18n) - Locale detection and routing
 * 2. Admin Route Protection - OAuth-based email verification
 * 3. Locale Cookie Management - Remembers user language preference
 * 
 * Admin Protection Flow:
 * - Detects admin routes (/admin/*)
 * - Verifies NextAuth session exists
 * - Checks email against DIRECTUS_ADMIN_EMAIL environment variable
 * - Redirects unauthorized users to /[locale]/unauthorized
 * - Redirects unauthenticated users to /[locale]/auth/signin
 * 
 * @see docs/security/admin-access-control.md - Security documentation
 * @see frontend/app/[locale]/unauthorized/page.tsx - Unauthorized page
 */

import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'en',

  // Enable locale detection but it will respect URL locale first
  localeDetection: true,

  // Always prefix locale in the URL
  localePrefix: 'always'
});

export default async function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname;

  // Skip middleware for api-docs route (it has its own layout)
  if (pathname === '/api-docs' || pathname.startsWith('/api-docs/')) {
    return NextResponse.next();
  }

  // Skip middleware for auth callback (OAuth redirect endpoint)
  if (pathname === '/auth/callback' || pathname.startsWith('/auth/callback')) {
    return NextResponse.next();
  }

  // Check if accessing admin routes
  const isAdminRoute = pathname.includes('/admin');
  
  if (isAdminRoute) {
    // Get the user's session token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // If no token, redirect to sign in
    if (!token || !token.email) {
      const locale = pathname.split('/')[1];
      const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check if user email matches admin email
    const adminEmail = process.env.DIRECTUS_ADMIN_EMAIL;
    
    if (!adminEmail) {
      console.error('DIRECTUS_ADMIN_EMAIL environment variable is not set');
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Verify user has admin privileges
    if (token.email !== adminEmail) {
      console.warn(`Unauthorized admin access attempt by: ${token.email}`);
      const locale = pathname.split('/')[1];
      const unauthorizedUrl = new URL(`/${locale}/unauthorized`, request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    // User is authorized, continue
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If URL already has a locale, respect it and don't redirect
  // This allows manual language switching to work
  if (pathnameHasLocale) {
    // Extract locale from URL
    const locale = pathname.split('/')[1];
    
    // Create response with the locale cookie set
    const response = intlMiddleware(request);
    
    // Set cookie to remember user's choice
    response.cookies.set('NEXT_LOCALE', locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/'
    });
    
    return response;
  }

  // For root path or paths without locale, use intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - /favicon.ico, /sitemap.xml, etc. (static files)
  // - /api-docs (has its own standalone layout)
  // - /auth/callback (OAuth redirect endpoint)
  matcher: ['/((?!api-docs|api|auth/callback|_next|_vercel|.*\\..*).*)']
};