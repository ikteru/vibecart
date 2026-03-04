import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { SupabaseInstagramTokenRepository } from '@/infrastructure/persistence/supabase';
import { CheckInstagramHealth } from '@/application/use-cases/instagram';

/**
 * GET /api/instagram/health?validate=true
 *
 * Returns the health status of the seller's Instagram connection.
 * Optional ?validate=true makes a lightweight API call to verify.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sellerRepository } = createRepositories(supabase);
    const seller = await sellerRepository.findByUserId(user.id);

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    const instagramTokenRepo = new SupabaseInstagramTokenRepository(supabase);
    const validate = request.nextUrl.searchParams.get('validate') === 'true';

    const useCase = new CheckInstagramHealth(instagramTokenRepo);
    const result = await useCase.execute({
      sellerId: seller.id,
      validate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/instagram/health error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
