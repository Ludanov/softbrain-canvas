import { NextRequest, NextResponse } from 'next/server';
import { createDirectus, rest, staticToken, readItems, updateItem } from '@directus/sdk';
import crypto from 'crypto';

const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;

const serverDirectus = createDirectus(directusUrl)
  .with(staticToken(directusToken))
  .with(rest());

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const users = await serverDirectus.request(
      readItems('site_customers', {
        filter: { email: { _eq: email } }
      })
    );

    // Always return success to prevent email enumeration
    if (!users || users.length === 0) {
      return NextResponse.json({ 
        message: 'If an account exists with that email, a reset link has been sent.' 
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset token
    await serverDirectus.request(
      updateItem('site_customers', user.id, {
        password_reset_token: resetToken,
        password_reset_expires: resetTokenExpiry.toISOString(),
      })
    );

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}&email=${email}`;

    // Log the link since we don't have a configured email service in this env
    console.log('--- PASSWORD RESET LINK ---');
    console.log(resetUrl);
    console.log('---------------------------');

    return NextResponse.json({ 
      message: 'If an account exists with that email, a reset link has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
