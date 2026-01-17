import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { InitiateInstagramAuth } from '@/application/use-cases/instagram';

const OAUTH_STATE_COOKIE = 'instagram_oauth_state';

/**
 * GET /api/auth/instagram
 *
 * Initiates Instagram OAuth flow.
 * Requires authentication. Redirects to Instagram authorization page.
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
    const useCase = new InitiateInstagramAuth();
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

    // 5. Redirect to Instagram
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error('Instagram OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Instagram connection' },
      { status: 500 }
    );
  }
}
