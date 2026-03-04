import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { DisconnectInstagram } from '@/application/use-cases/instagram';

/**
 * POST /api/instagram/disconnect
 *
 * Disconnect Instagram from the seller's account.
 */
export async function POST() {
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
    const { sellerRepository: readSellerRepo } = createRepositories(supabase);
    const seller = await readSellerRepo.findByUserId(user.id);

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    // 3. Use admin client for write operations (auth'd client for reads, admin for writes)
    const adminClient = createAdminClient();
    const { instagramTokenRepository, sellerRepository } = createRepositories(supabase, adminClient);

    // 4. Disconnect Instagram
    const useCase = new DisconnectInstagram(instagramTokenRepository, sellerRepository);
    const result = await useCase.execute({
      sellerId: seller.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/instagram/disconnect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
