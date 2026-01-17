import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient, createAdminClient, getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetSellerProducts } from '@/application/use-cases/products';
import { CreateProduct } from '@/application/use-cases/products';
import type { ProductCategoryType } from '@/domain/value-objects/ProductCategory';

/**
 * GET /api/products
 *
 * List products with filtering and pagination.
 * Query params: sellerId (required), category, isActive, search, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sellerId = searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json(
        { error: 'sellerId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { productRepository } = createRepositories(supabase);
    const useCase = new GetSellerProducts(productRepository);

    const result = await useCase.execute({
      sellerId,
      category: searchParams.get('category') as ProductCategoryType | undefined,
      isActive: searchParams.get('isActive')
        ? searchParams.get('isActive') === 'true'
        : undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!, 10)
        : undefined,
      offset: searchParams.get('offset')
        ? parseInt(searchParams.get('offset')!, 10)
        : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 *
 * Create a new product. Requires authentication.
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

    // Use regular client to get seller (RLS allows reads)
    const supabase = await createClient();
    const { sellerRepository } = createRepositories(supabase);

    const seller = await sellerRepository.findByUserId(user.id);
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found. Please create a shop first.' },
        { status: 404 }
      );
    }

    // Use admin client for write operations (bypasses RLS)
    // Authorization verified via user → seller ownership above
    const adminClient = createAdminClient();
    const { productRepository } = createRepositories(adminClient);

    const useCase = new CreateProduct(productRepository);
    const result = await useCase.execute({
      sellerId: seller.id,
      title: body.title,
      description: body.description,
      price: body.price,
      discountPrice: body.discountPrice,
      promotionLabel: body.promotionLabel,
      stock: body.stock,
      videoUrl: body.videoUrl,
      instagramMediaId: body.instagramMediaId,
      category: body.category,
      variants: body.variants,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.product, { status: 201 });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
