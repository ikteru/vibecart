import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { FetchInstagramMedia } from '@/application/use-cases/instagram';

/**
 * GET /api/instagram/media
 *
 * Fetch Instagram media for the authenticated seller.
 * Query params: limit, after (pagination cursor)
 */
export async function GET(request: NextRequest) {
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

    // 2. Get seller
    const { sellerRepository } = createRepositories(supabase);
    const seller = await sellerRepository.findByUserId(user.id);

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    // 3. Parse query params
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : undefined;
    const after = searchParams.get('after') || undefined;

    // 4. Use admin client to access token (encrypted data)
    const adminClient = createAdminClient();
    const { instagramTokenRepository } = createRepositories(adminClient);

    // 5. Fetch media
    const useCase = new FetchInstagramMedia(instagramTokenRepository);
    const result = await useCase.execute({
      sellerId: seller.id,
      limit,
      after,
    });

    if (!result.success) {
      const status = result.needsReconnect ? 401 : 400;
      return NextResponse.json(
        {
          error: result.error,
          needsReconnect: result.needsReconnect,
        },
        { status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('GET /api/instagram/media error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
