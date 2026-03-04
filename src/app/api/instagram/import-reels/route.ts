import { NextResponse } from 'next/server';
import { getCurrentUser, createClient, createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { ImportReelsAsDrafts } from '@/application/use-cases/instagram';

/**
 * POST /api/instagram/import-reels
 *
 * Imports Instagram VIDEO reels as draft products.
 * Requires authentication and seller profile.
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();
    const { sellerRepository, instagramTokenRepository, productRepository } =
      createRepositories(supabase, adminClient);

    const seller = await sellerRepository.findByUserId(user.id);
    if (!seller) {
      return NextResponse.json(
        { success: false, error: 'Seller not found' },
        { status: 404 }
      );
    }

    const useCase = new ImportReelsAsDrafts(instagramTokenRepository, productRepository);
    const result = await useCase.execute({
      sellerId: seller.id,
      limit: 20,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      imported: result.imported,
      drafts: result.drafts,
    });
  } catch (error) {
    console.error('POST /api/instagram/import-reels error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
