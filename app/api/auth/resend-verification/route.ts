import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createDirectus, rest, staticToken, readItems, updateItem } from '@directus/sdk';
import { sendEmailVerification } from '@/lib/email';

const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;

const serverDirectus = createDirectus(directusUrl)
  .with(staticToken(directusToken))
  .with(rest());

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user with this email
    const users = await serverDirectus.request(
      readItems('site_customers', {
        filter: { email: { _eq: email } }
      })
    );

    if (!users || users.length === 0) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { message: 'If an account exists with this email, a verification link has been sent.' },
        { status: 200 }
      );
    }

    const user = users[0] as any;

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        { message: 'This email is already verified. You can sign in.' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Update user with new token
    await serverDirectus.request(
      updateItem('site_customers', user.id, {
        verification_token: verificationToken,
        verification_token_expires: verificationExpires
      })
    );

    // Send verification email
    try {
      await sendEmailVerification(email, verificationToken, user.name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { message: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Verification email sent successfully!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
