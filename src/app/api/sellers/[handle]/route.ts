import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetSellerByHandle } from '@/application/use-cases/sellers';

interface RouteParams {
  params: Promise<{ handle: string }>;
}

/**
 * GET /api/sellers/:handle
 *
 * Get public seller/shop info by handle.
 * Used for public shop pages.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { handle } = await params;
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'ar-MA';

    const supabase = await createClient();
    const { sellerRepository } = createRepositories(supabase);
    const useCase = new GetSellerByHandle(sellerRepository);

    const result = await useCase.execute({ handle, locale });

    if (!result.seller) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.seller);
  } catch (error) {
    console.error('GET /api/sellers/:handle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
