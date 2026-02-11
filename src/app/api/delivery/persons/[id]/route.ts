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
} from '@/infrastructure/persistence/supabase';
import {
  UpdateDeliveryPerson,
  DeleteDeliveryPerson,
} from '@/application/use-cases/delivery';
import type { UpdateDeliveryPersonDTO } from '@/application/dtos/DeliveryDTO';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/delivery/persons/[id]
 *
 * Get a single delivery person by ID.
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

    // Get delivery person
    const deliveryPersonRepository = new SupabaseDeliveryPersonRepository(supabase);
    const deliveryPerson = await deliveryPersonRepository.findByIdAndSeller(
      id,
      seller.id
    );

    if (!deliveryPerson) {
      return NextResponse.json(
        { success: false, error: 'Delivery person not found' },
        { status: 404 }
      );
    }

    // Import mapper to convert to DTO
    const { DeliveryPersonMapper } = await import(
      '@/application/mappers/DeliveryMapper'
    );

    return NextResponse.json({
      success: true,
      deliveryPerson: DeliveryPersonMapper.toDTO(deliveryPerson),
    });
  } catch (error) {
    console.error('GET /api/delivery/persons/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/delivery/persons/[id]
 *
 * Update a delivery person.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Update delivery person using admin client
    const adminClient = createAdminClient();
    const deliveryPersonRepository = new SupabaseDeliveryPersonRepository(
      supabase,
      adminClient
    );

    const useCase = new UpdateDeliveryPerson(deliveryPersonRepository);
    const input: UpdateDeliveryPersonDTO = {
      id,
      sellerId: seller.id,
      name: body.name,
      phone: body.phone,
      notes: body.notes,
      isActive: body.isActive,
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
      deliveryPerson: result.deliveryPerson,
    });
  } catch (error) {
    console.error('PUT /api/delivery/persons/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/delivery/persons/[id]
 *
 * Delete a delivery person.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Delete delivery person using admin client
    const adminClient = createAdminClient();
    const deliveryPersonRepository = new SupabaseDeliveryPersonRepository(
      supabase,
      adminClient
    );

    const useCase = new DeleteDeliveryPerson(deliveryPersonRepository);
    const result = await useCase.execute({
      id,
      sellerId: seller.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/delivery/persons/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
