import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient, createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { CompleteInstagramAuth } from '@/application/use-cases/instagram';
import { INSTAGRAM_ERROR_CODES } from '@/domain/value-objects/InstagramErrorCode';
import { logger } from '@/infrastructure/utils/logger';

const OAUTH_STATE_COOKIE = 'instagram_oauth_state';

/**
 * GET /api/auth/instagram/callback
 *
 * Instagram OAuth callback handler (reconnect from settings).
 * Exchanges code for token and stores encrypted token.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorReason = searchParams.get('error_reason');
  const errorDescription = searchParams.get('error_description');

  // Base URL for redirects
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const settingsUrl = `${baseUrl}/ar-MA/seller/settings`;

  // Handle user denial
  if (error) {
    logger.warn('Instagram OAuth denied', { context: 'instagram', error, errorReason, errorDescription });
    const errorUrl = new URL(settingsUrl);
    errorUrl.searchParams.set('ig_err', INSTAGRAM_ERROR_CODES.DENIED);
    return NextResponse.redirect(errorUrl);
  }

  // Validate required params
  if (!code || !state) {
    const errorUrl = new URL(settingsUrl);
    errorUrl.searchParams.set('ig_err', INSTAGRAM_ERROR_CODES.MISSING_PARAMS);
    return NextResponse.redirect(errorUrl);
  }

  try {
    // 1. Get stored state from cookie
    const cookieStore = await cookies();
    const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

    if (!expectedState) {
      const errorUrl = new URL(settingsUrl);
      errorUrl.searchParams.set('ig_err', INSTAGRAM_ERROR_CODES.SESSION_EXPIRED);
      return NextResponse.redirect(errorUrl);
    }

    // 2. Clear the state cookie
    cookieStore.delete(OAUTH_STATE_COOKIE);

    // 3. Verify authentication (user should still be logged in)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorUrl = new URL(settingsUrl);
      errorUrl.searchParams.set('ig_err', INSTAGRAM_ERROR_CODES.LOGIN_REQUIRED);
      return NextResponse.redirect(errorUrl);
    }

    // 4. Use admin client for write operations (auth'd client for reads, admin for writes)
    const adminClient = createAdminClient();
    const { instagramTokenRepository, sellerRepository } = createRepositories(supabase, adminClient);

    // 5. Complete the OAuth flow
    const useCase = new CompleteInstagramAuth(instagramTokenRepository, sellerRepository);
    const result = await useCase.execute({
      code,
      state,
      expectedState,
    });

    if (!result.success) {
      const errorUrl = new URL(settingsUrl);
      errorUrl.searchParams.set('ig_err', result.errorCode || INSTAGRAM_ERROR_CODES.CONNECTION_FAILED);
      return NextResponse.redirect(errorUrl);
    }

    // 6. Success! Redirect to settings with success message
    const successUrl = new URL(settingsUrl);
    successUrl.searchParams.set('instagram_success', 'true');
    successUrl.searchParams.set('instagram_username', result.connection?.username || '');
    return NextResponse.redirect(successUrl);

  } catch (error) {
    logger.error('Instagram callback error', { context: 'instagram', error: error instanceof Error ? error.message : 'Unknown error' });
    const errorUrl = new URL(settingsUrl);
    errorUrl.searchParams.set('ig_err', INSTAGRAM_ERROR_CODES.UNEXPECTED);
    return NextResponse.redirect(errorUrl);
  }
}
