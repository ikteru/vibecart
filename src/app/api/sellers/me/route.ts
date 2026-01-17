import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient, getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetSellerProfile } from '@/application/use-cases/sellers';
import { UpdateSellerProfile } from '@/application/use-cases/sellers';
import { CreateSeller } from '@/application/use-cases/sellers';

/**
 * GET /api/sellers/me
 *
 * Get the authenticated seller's profile.
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'ar-MA';

    const supabase = await createClient();
    const { sellerRepository } = createRepositories(supabase);
    const useCase = new GetSellerProfile(sellerRepository);

    const result = await useCase.execute({ userId: user.id, locale });

    if (!result.seller) {
      return NextResponse.json(
        { error: 'Seller profile not found. Please create a shop first.' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.seller);
  } catch (error) {
    console.error('GET /api/sellers/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sellers/me
 *
 * Create a new seller profile for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'ar-MA';

    const supabase = await createClient();
    const { sellerRepository } = createRepositories(supabase);
    const useCase = new CreateSeller(sellerRepository);

    const result = await useCase.execute(
      {
        userId: user.id,
        shopName: body.shopName,
        handle: body.handle,
        whatsappNumber: body.whatsappNumber,
        shopConfig: body.shopConfig,
      },
      locale
    );

    if (!result.success) {
      const status = result.error === 'User already has a seller account' ? 409 :
                     result.error === 'Handle is already taken' ? 409 : 400;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return NextResponse.json(result.seller, { status: 201 });
  } catch (error) {
    console.error('POST /api/sellers/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sellers/me
 *
 * Update the authenticated seller's profile.
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'ar-MA';

    const supabase = await createClient();
    const { sellerRepository } = createRepositories(supabase);
    const useCase = new UpdateSellerProfile(sellerRepository);

    const result = await useCase.execute({
      userId: user.id,
      updates: body,
      locale,
    });

    if (!result.success) {
      const status = result.error === 'Seller not found' ? 404 : 400;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return NextResponse.json(result.seller);
  } catch (error) {
    console.error('PATCH /api/sellers/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
