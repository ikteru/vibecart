import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  createClient,
  createAdminClient,
  getCurrentUser,
} from '@/infrastructure/auth/supabase-server';
import {
  SupabaseSellerRepository,
  SupabaseDeliveryPersonRepository,
  SupabaseOrderDispatchRepository,
  SupabaseOrderRepository,
} from '@/infrastructure/persistence/supabase';
import {
  CreateManualDispatch,
  GetOrderDispatches,
} from '@/application/use-cases/delivery';
import type { CreateManualDispatchDTO } from '@/application/dtos/DeliveryDTO';

/**
 * GET /api/delivery/dispatch
 *
 * Get dispatches for an order.
 * Query params: orderId (required)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get seller
    const supabase = await createClient();
    const sellerRepository = new SupabaseSellerRepository(supabase);
    const seller = await sellerRepository.findByUserId(user.id);

    if (!seller) {
      return NextResponse.json(
        { success: false, error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Parse query params
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required' },
        { status: 400 }
      );
    }

    // Get dispatches
    const orderDispatchRepository = new SupabaseOrderDispatchRepository(supabase);
    const useCase = new GetOrderDispatches(orderDispatchRepository);
    const result = await useCase.execute({
      orderId,
      sellerId: seller.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      dispatches: result.dispatches,
    });
  } catch (error) {
    console.error('GET /api/delivery/dispatch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/delivery/dispatch
 *
 * Create a new dispatch for an order.
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get seller
    const supabase = await createClient();
    const sellerRepository = new SupabaseSellerRepository(supabase);
    const seller = await sellerRepository.findByUserId(user.id);

    if (!seller) {
      return NextResponse.json(
        { success: false, error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Parse body
    const body = await request.json();

    // Validate required fields
    if (!body.orderId || !body.deliveryPersonId) {
      return NextResponse.json(
        { success: false, error: 'orderId and deliveryPersonId are required' },
        { status: 400 }
      );
    }

    // Create dispatch using admin client
    const adminClient = createAdminClient();
    const orderDispatchRepository = new SupabaseOrderDispatchRepository(
      supabase,
      adminClient
    );
    const deliveryPersonRepository = new SupabaseDeliveryPersonRepository(
      supabase,
      adminClient
    );
    const orderRepository = new SupabaseOrderRepository(supabase);

    const useCase = new CreateManualDispatch(
      orderDispatchRepository,
      deliveryPersonRepository,
      orderRepository
    );

    const input: CreateManualDispatchDTO = {
      orderId: body.orderId,
      sellerId: seller.id,
      deliveryPersonId: body.deliveryPersonId,
      codAmount: body.codAmount,
      notes: body.notes,
    };

    const result = await useCase.execute(input);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      dispatch: result.dispatch,
    });
  } catch (error) {
    console.error('POST /api/delivery/dispatch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
