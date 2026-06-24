import { NextRequest, NextResponse } from 'next/server';
import { createDirectus, rest, staticToken, readItems, updateItem } from '@directus/sdk';

const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const directusToken = process.env.DIRECTUS_STATIC_TOKEN!;

const serverDirectus = createDirectus(directusUrl)
  .with(staticToken(directusToken))
  .with(rest());

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user with this verification token
    const users = await serverDirectus.request(
      readItems('site_customers', {
        filter: {
          verification_token: { _eq: token },
          verification_token_expires: { _gt: new Date().toISOString() }
        }
      })
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { message: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    const user = users[0] as any;

    // Update user to mark email as verified
    await serverDirectus.request(
      updateItem('site_customers', user.id, {
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
        status: 'active' // Activate the account
      })
    );

    return NextResponse.json(
      { message: 'Email verified successfully! You can now sign in.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { message: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}
