import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient, getCurrentUser } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { GetProduct } from '@/application/use-cases/products';
import { UpdateProduct } from '@/application/use-cases/products';
import { DeleteProduct } from '@/application/use-cases/products';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/products/:id
 *
 * Get a single product by ID.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const { productRepository } = createRepositories(supabase);
    const useCase = new GetProduct(productRepository);

    const result = await useCase.execute({ productId: id });

    if (!result.product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.product);
  } catch (error) {
    console.error('GET /api/products/:id error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products/:id
 *
 * Update a product. Requires authentication and ownership.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const supabase = await createClient();
    const { productRepository, sellerRepository } = createRepositories(supabase);

    // Get seller ID from authenticated user
    const seller = await sellerRepository.findByUserId(user.id);
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    const useCase = new UpdateProduct(productRepository);
    const result = await useCase.execute({
      productId: id,
      sellerId: seller.id,
      updates: body,
    });

    if (!result.success) {
      const status = result.error === 'Product not found' ? 404 :
                     result.error === 'Not authorized to update this product' ? 403 : 400;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return NextResponse.json(result.product);
  } catch (error) {
    console.error('PATCH /api/products/:id error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/:id
 *
 * Delete a product. Requires authentication and ownership.
 * Query param: hardDelete=true to permanently delete (default: soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get('hardDelete') === 'true';

    const supabase = await createClient();
    const { productRepository, sellerRepository } = createRepositories(supabase);

    // Get seller ID from authenticated user
    const seller = await sellerRepository.findByUserId(user.id);
    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    const useCase = new DeleteProduct(productRepository);
    const result = await useCase.execute({
      productId: id,
      sellerId: seller.id,
      hardDelete,
    });

    if (!result.success) {
      const status = result.error === 'Product not found' ? 404 :
                     result.error === 'Not authorized to delete this product' ? 403 : 400;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/products/:id error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
