import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { InitiateWhatsAppAuth } from '@/application/use-cases/whatsapp-business';

const OAUTH_STATE_COOKIE = 'whatsapp_oauth_state';

/**
 * GET /api/auth/whatsapp
 *
 * Initiates WhatsApp Business OAuth flow via Facebook Login.
 * Requires authentication. Redirects to Facebook authorization page.
 */
export async function GET() {
  try {
    // 1. Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get seller ID
    const { sellerRepository } = createRepositories(supabase);
    const seller = await sellerRepository.findByUserId(user.id);

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    // 3. Generate authorization URL with CSRF state
    const useCase = new InitiateWhatsAppAuth();
    const { authorizationUrl, state } = await useCase.execute({
      sellerId: seller.id,
    });

    // 4. Store state in HTTP-only cookie for validation on callback
    const cookieStore = await cookies();
    cookieStore.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    // 5. Redirect to Facebook
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error('WhatsApp OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate WhatsApp connection' },
      { status: 500 }
    );
  }
}
