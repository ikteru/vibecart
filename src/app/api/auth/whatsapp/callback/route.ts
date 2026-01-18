import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient, createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { CompleteWhatsAppAuth } from '@/application/use-cases/whatsapp-business';

const OAUTH_STATE_COOKIE = 'whatsapp_oauth_state';

/**
 * GET /api/auth/whatsapp/callback
 *
 * Facebook OAuth callback handler for WhatsApp Business.
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
    console.warn('WhatsApp OAuth denied:', { error, errorReason, errorDescription });
    const errorUrl = new URL(settingsUrl);
    errorUrl.searchParams.set('whatsapp_error', errorDescription || 'Authorization denied');
    return NextResponse.redirect(errorUrl);
  }

  // Validate required params
  if (!code || !state) {
    const errorUrl = new URL(settingsUrl);
    errorUrl.searchParams.set('whatsapp_error', 'Missing authorization parameters');
    return NextResponse.redirect(errorUrl);
  }

  try {
    // 1. Get stored state from cookie
    const cookieStore = await cookies();
    const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

    if (!expectedState) {
      const errorUrl = new URL(settingsUrl);
      errorUrl.searchParams.set('whatsapp_error', 'Session expired. Please try again.');
      return NextResponse.redirect(errorUrl);
    }

    // 2. Clear the state cookie
    cookieStore.delete(OAUTH_STATE_COOKIE);

    // 3. Verify authentication (user should still be logged in)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorUrl = new URL(settingsUrl);
      errorUrl.searchParams.set('whatsapp_error', 'Please log in and try again');
      return NextResponse.redirect(errorUrl);
    }

    // 4. Use admin client for write operations
    const adminClient = createAdminClient();
    const { whatsAppTokenRepository, sellerRepository } = createRepositories(adminClient);

    // 5. Complete the OAuth flow
    const useCase = new CompleteWhatsAppAuth(whatsAppTokenRepository, sellerRepository);
    const result = await useCase.execute({
      code,
      state,
      expectedState,
    });

    if (!result.success) {
      const errorUrl = new URL(settingsUrl);
      errorUrl.searchParams.set('whatsapp_error', result.error || 'Connection failed');
      return NextResponse.redirect(errorUrl);
    }

    // 6. Success! Redirect to settings with success message
    const successUrl = new URL(settingsUrl);
    successUrl.searchParams.set('whatsapp_success', 'true');
    successUrl.searchParams.set('whatsapp_phone', result.connection?.displayPhoneNumber || '');
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('WhatsApp callback error:', error);
    const errorUrl = new URL(settingsUrl);
    errorUrl.searchParams.set('whatsapp_error', 'An unexpected error occurred');
    return NextResponse.redirect(errorUrl);
  }
}
