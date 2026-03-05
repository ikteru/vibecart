import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { InstagramGraphService } from '@/infrastructure/external-services/InstagramGraphService';
import { randomBytes } from 'crypto';

const OAUTH_STATE_COOKIE = 'instagram_login_state';

/**
 * GET /api/auth/instagram/login
 *
 * Initiates Instagram OAuth for login/signup (no auth required).
 * Redirects to Instagram authorization page.
 */
export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'App URL not configured' },
        { status: 500 }
      );
    }

    const loginCallbackUri = `${baseUrl}/api/auth/instagram/login/callback`;

    const instagramService = new InstagramGraphService();

    // Read optional "from" param (e.g., "beta") to pass through OAuth flow
    const from = request.nextUrl.searchParams.get('from');

    // Generate state for CSRF protection (no sellerId — this is a login flow)
    const stateData = {
      purpose: 'login',
      nonce: randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      ...(from && { from }),
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    const authorizationUrl = instagramService.getAuthorizationUrl(state, loginCallbackUri);

    // Store state in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error('Instagram login initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Instagram login' },
      { status: 500 }
    );
  }
}
