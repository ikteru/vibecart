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
  CreateDeliveryPerson,
  GetSellerDeliveryPersons,
} from '@/application/use-cases/delivery';
import type { CreateDeliveryPersonDTO } from '@/application/dtos/DeliveryDTO';

/**
 * GET /api/delivery/persons
 *
 * Get all delivery persons for the authenticated seller.
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
    const activeOnly = url.searchParams.get('activeOnly') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Get delivery persons
    const deliveryPersonRepository = new SupabaseDeliveryPersonRepository(supabase);
    const useCase = new GetSellerDeliveryPersons(deliveryPersonRepository);
    const result = await useCase.execute({
      sellerId: seller.id,
      activeOnly,
      limit,
      offset,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('GET /api/delivery/persons error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/delivery/persons
 *
 * Create a new delivery person.
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
    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // Create delivery person using admin client for writes
    const adminClient = createAdminClient();
    const deliveryPersonRepository = new SupabaseDeliveryPersonRepository(
      supabase,
      adminClient
    );

    const useCase = new CreateDeliveryPerson(deliveryPersonRepository);
    const input: CreateDeliveryPersonDTO = {
      sellerId: seller.id,
      name: body.name,
      phone: body.phone,
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
      deliveryPerson: result.deliveryPerson,
    });
  } catch (error) {
    console.error('POST /api/delivery/persons error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
