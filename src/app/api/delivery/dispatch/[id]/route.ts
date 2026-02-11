import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  createClient,
  createAdminClient,
  getCurrentUser,
} from '@/infrastructure/auth/supabase-server';
import {
  SupabaseSellerRepository,
  SupabaseOrderDispatchRepository,
} from '@/infrastructure/persistence/supabase';
import { UpdateDispatchStatus } from '@/application/use-cases/delivery';
import type { DispatchStatus } from '@/domain/entities/OrderDispatch';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/delivery/dispatch/[id]
 *
 * Get a single dispatch by ID.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Get dispatch
    const orderDispatchRepository = new SupabaseOrderDispatchRepository(supabase);
    const dispatch = await orderDispatchRepository.findByIdAndSeller(id, seller.id);

    if (!dispatch) {
      return NextResponse.json(
        { success: false, error: 'Dispatch not found' },
        { status: 404 }
      );
    }

    // Import mapper to convert to DTO
    const { OrderDispatchMapper } = await import(
      '@/application/mappers/DeliveryMapper'
    );

    return NextResponse.json({
      success: true,
      dispatch: OrderDispatchMapper.toDTO(dispatch),
    });
  } catch (error) {
    console.error('GET /api/delivery/dispatch/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/delivery/dispatch/[id]
 *
 * Update dispatch status.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Validate status
    const validStatuses: DispatchStatus[] = [
      'pending',
      'picked_up',
      'in_transit',
      'delivered',
      'failed',
      'returned',
    ];

    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Update status using admin client
    const adminClient = createAdminClient();
    const orderDispatchRepository = new SupabaseOrderDispatchRepository(
      supabase,
      adminClient
    );

    const useCase = new UpdateDispatchStatus(orderDispatchRepository);
    const result = await useCase.execute({
      dispatchId: id,
      sellerId: seller.id,
      status: body.status,
      note: body.note,
    });

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
    console.error('PATCH /api/delivery/dispatch/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
