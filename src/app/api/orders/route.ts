import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { CreateOrder } from '@/application/use-cases/orders/CreateOrder';
import { SendOrderNotification } from '@/application/use-cases/whatsapp-business';
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

    // Log the incoming request for debugging
    console.log('Creating order with:', {
      sellerId,
      customerName,
      customerPhone,
      shippingAddress,
      itemsCount: items?.length,
      items: items?.map((i: { title: string; price: number; quantity: number }) => ({
        title: i.title,
        price: i.price,
        quantity: i.quantity,
      })),
    });

    // Create order using admin client to bypass RLS for public checkout
    // Public checkout is anonymous - no authenticated user session
    const adminClient = createAdminClient();
    const { orderRepository } = createRepositories(adminClient);

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
      console.error('CreateOrder failed:', result.error);
      console.error('Input was:', { sellerId, customerName, customerPhone, shippingAddress, items: items?.length });
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Send WhatsApp confirmation request (fire and forget - don't block response)
    if (result.order) {
      sendPendingConfirmationRequest(result.order.id).catch((err) => {
        console.error('Failed to send WhatsApp confirmation request:', err);
      });
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

/**
 * Send WhatsApp pending confirmation request to customer
 * This runs asynchronously and doesn't block the order creation response
 */
async function sendPendingConfirmationRequest(orderId: string): Promise<void> {
  try {
    // Use admin client to access WhatsApp tokens (may have RLS restrictions)
    const adminClient = createAdminClient();
    const repos = createRepositories(adminClient);

    const sendNotification = new SendOrderNotification(
      repos.whatsAppTokenRepository,
      repos.whatsAppMessageRepository,
      repos.orderRepository
    );

    // Try template message first
    const result = await sendNotification.execute({
      orderId,
      notificationType: 'ORDER_PENDING_CONFIRMATION',
    });

    if (result.success) {
      console.log(`WhatsApp confirmation request sent for order ${orderId}`);
    } else {
      // If template fails (e.g., not approved yet), try text message fallback
      console.log(`Template message failed: ${result.error}, trying text message fallback...`);
      const textResult = await sendNotification.sendPendingConfirmationText(orderId);

      if (textResult.success) {
        console.log(`WhatsApp text confirmation sent for order ${orderId}`);
      } else {
        console.warn(`Failed to send WhatsApp confirmation: ${textResult.error}`);
      }
    }
  } catch (error) {
    // Log but don't throw - this shouldn't fail order creation
    console.error('Error sending WhatsApp confirmation request:', error);
  }
}
