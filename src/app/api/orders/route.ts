import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { CreateOrder } from '@/application/use-cases/orders/CreateOrder';
import type { CreateOrderDTO } from '@/application/dtos/OrderDTO';

/**
 * POST /api/orders
 *
 * Creates a new order from checkout.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      sellerId,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      shippingCost,
    } = body as CreateOrderDTO;

    if (!sellerId) {
      return NextResponse.json(
        { success: false, error: 'Seller ID is required' },
        { status: 400 }
      );
    }

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Customer name and phone are required' },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.city || !shippingAddress.street) {
      return NextResponse.json(
        { success: false, error: 'Shipping address with city and street is required' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Create order
    const supabase = await createClient();
    const { orderRepository } = createRepositories(supabase);

    const createOrderUseCase = new CreateOrder(orderRepository);
    const result = await createOrderUseCase.execute({
      sellerId,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      shippingCost: shippingCost || 0,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
