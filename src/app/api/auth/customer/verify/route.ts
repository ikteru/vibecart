import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';
import {
  createSessionToken,
  getSessionCookieConfig,
} from '@/infrastructure/auth/customer-session';

/**
 * GET /api/auth/customer/verify?token=xxx
 *
 * Verify a magic link token and create a customer session.
 * Sets an HMAC-signed httpOnly cookie and redirects to the stored redirect URL.
 *
 * This is the URL customers click from their WhatsApp message.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return redirectWithError(request, 'Missing token');
  }

  try {
    const adminClient = createAdminClient();

    // Look up the token
    const { data: tokenRow, error } = await adminClient
      .from('customer_login_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !tokenRow) {
      return redirectWithError(request, 'Invalid or expired link');
    }

    // Check if already used
    if (tokenRow.used_at) {
      return redirectWithError(request, 'This link has already been used');
    }

    // Check if expired
    if (new Date(tokenRow.expires_at) < new Date()) {
      return redirectWithError(request, 'This link has expired');
    }

    // Mark token as used
    await adminClient
      .from('customer_login_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id);

    // Create session cookie
    const sessionToken = createSessionToken(tokenRow.phone);
    const cookieConfig = getSessionCookieConfig(sessionToken);

    // Determine redirect URL
    const redirectUrl = tokenRow.redirect_url || '/';

    // Build redirect response with session cookie
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    response.cookies.set(
      cookieConfig.name,
      cookieConfig.value,
      {
        httpOnly: cookieConfig.httpOnly,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        maxAge: cookieConfig.maxAge,
        path: cookieConfig.path,
      }
    );

    return response;
  } catch (error) {
    console.error('GET /api/auth/customer/verify error:', error);
    return redirectWithError(request, 'Something went wrong');
  }
}

/**
 * Redirect to the default locale with an error message.
 * We don't know the user's locale from the token, so redirect to root
 * with an error query param that the UI can display.
 */
function redirectWithError(request: NextRequest, message: string) {
  const url = new URL('/', request.url);
  url.searchParams.set('login_error', message);
  return NextResponse.redirect(url);
}
