import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import crypto from 'crypto';
import { createDirectus, rest, staticToken, readItems, createItem } from '@directus/sdk';
import { sendEmailVerification } from '@/lib/email';

const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;

const serverDirectus = createDirectus(directusUrl)
  .with(staticToken(directusToken))
  .with(rest());

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    // Validate required fields
    if (!firstName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await serverDirectus.request(
      readItems('site_customers', {
        filter: { email: { _eq: email } }
      })
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Create user in site_customers table
    try {
      const fullName = lastName ? `${firstName} ${lastName}` : firstName;
      
      const newUser = await serverDirectus.request(
        createItem('site_customers', {
          email,
          password_hash: hashedPassword,
          name: fullName,
          email_verified: false,
          verification_token: verificationToken,
          verification_token_expires: verificationExpires,
          status: 'inactive' // Set to inactive until verified
        })
      );

      // Send verification email
      try {
        await sendEmailVerification(email, verificationToken, fullName);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the registration if email fails
      }

      return NextResponse.json(
        { 
          success: true,
          message: 'Account created successfully. Please check your email to verify your account.',
          userId: (newUser as any).id 
        },
        { status: 201 }
      );
    } catch (directusError: any) {
      console.error('Directus error:', directusError);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
