import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';
import { CreateOrder } from '@/application/use-cases/orders/CreateOrder';
import { SendOrderNotification } from '@/application/use-cases/whatsapp-business';
import type { CreateOrderDTO } from '@/application/dtos/OrderDTO';
import { logger } from '@/infrastructure/utils/logger';

/**
 * POST /api/orders
 *
 * Creates a new order from checkout.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create order using admin client to bypass RLS for public checkout
    // Public checkout is anonymous - no authenticated user session
    const adminClient = createAdminClient();
    const { orderRepository } = createRepositories(adminClient);

    // Use case handles all validation internally (thin controller pattern)
    const createOrderUseCase = new CreateOrder(orderRepository);
    const result = await createOrderUseCase.execute(body as CreateOrderDTO);

    if (!result.success) {
      // Log error without PII
      console.error('CreateOrder failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          validationErrors: result.validationErrors,
        },
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
      logger.info('WhatsApp confirmation request sent', { context: 'orders', orderId });
    } else {
      // If template fails (e.g., not approved yet), try text message fallback
      logger.warn('Template message failed, trying text message fallback', { context: 'orders', orderId, error: result.error });
      const textResult = await sendNotification.sendPendingConfirmationText(orderId);

      if (textResult.success) {
        logger.info('WhatsApp text confirmation sent', { context: 'orders', orderId });
      } else {
        logger.warn('Failed to send WhatsApp confirmation', { context: 'orders', orderId, error: textResult.error });
      }
    }
  } catch (error) {
    // Log but don't throw - this shouldn't fail order creation
    console.error('Error sending WhatsApp confirmation request:', error);
  }
}
