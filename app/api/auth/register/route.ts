import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createDirectus, rest, staticToken, readItems, createItem } from '@directus/sdk';
import { sendEmailVerification } from '@/lib/email';

const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;

const serverDirectus = createDirectus(directusUrl)
  .with(staticToken(directusToken))
  .with(rest());

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // 1. Basic presence check
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 3. Password strength validation (min 8 chars, one letter, one number)
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      return NextResponse.json(
        { message: 'Password must contain at least one letter and one number' },
        { status: 400 }
      );
    }

    // 4. Name length validation
    if (name && name.length > 100) {
      return NextResponse.json(
        { message: 'Name is too long' },
        { status: 400 }
      );
    }

    // 5. Check if user already exists
    const existingUsers = await serverDirectus.request(
      readItems('site_customers', {
        filter: { email: { _eq: email } }
      })
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // 6. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 7. Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // 8. Create user
    const newUser = await serverDirectus.request(
      createItem('site_customers', {
        email,
        password_hash: hashedPassword,
        name: name || '',
        email_verified: false,
        verification_token: verificationToken,
        verification_token_expires: verificationExpires,
        status: 'inactive' // Set to inactive until verified
      })
    );

    // 9. Send verification email
    await sendEmailVerification(email, verificationToken, name);

    return NextResponse.json(
      { 
        message: 'Registration successful. Please check your email to verify your account.',
        userId: (newUser as any).id 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
