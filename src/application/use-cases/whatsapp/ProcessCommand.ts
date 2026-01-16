import type { CommandType } from '@/infrastructure/external-services/WhatsAppCommandParser';
import { GeminiAIService } from '@/infrastructure/external-services/GeminiAIService';
import { createClient } from '@/infrastructure/auth/supabase-server';

/**
 * Process WhatsApp Command Input
 */
export interface ProcessCommandInput {
  sellerId: string;
  buyerPhone: string;
  rawMessage: string;
  command: CommandType;
  args: Record<string, string>;
}

/**
 * Process WhatsApp Command Result
 */
export interface ProcessCommandResult {
  success: boolean;
  response: string;
  error?: string;
}

/**
 * Order status mapping for display
 */
const STATUS_DISPLAY: Record<string, Record<string, string>> = {
  'en': {
    'pending': 'Pending confirmation',
    'confirmed': 'Confirmed, preparing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
  },
  'ar-MA': {
    'pending': 'كيتسنا التأكيد',
    'confirmed': 'تأكد، كنحضروه',
    'shipped': 'تصيفط',
    'delivered': 'وصل',
    'cancelled': 'تلغى',
  },
  'ar': {
    'pending': 'في انتظار التأكيد',
    'confirmed': 'مؤكد، قيد التحضير',
    'shipped': 'تم الشحن',
    'delivered': 'تم التوصيل',
    'cancelled': 'ملغي',
  },
  'fr': {
    'pending': 'En attente de confirmation',
    'confirmed': 'Confirmé, en préparation',
    'shipped': 'Expédié',
    'delivered': 'Livré',
    'cancelled': 'Annulé',
  },
};

/**
 * Process a WhatsApp slash command
 *
 * This is the main use case for handling WhatsApp commands.
 * It executes the appropriate action based on the command type.
 */
export async function processWhatsAppCommand(
  input: ProcessCommandInput
): Promise<ProcessCommandResult> {
  const { sellerId, buyerPhone, command, args } = input;
  const geminiService = new GeminiAIService();

  // Default language - could be fetched from seller settings
  const language: 'ar-MA' | 'ar' | 'fr' | 'en' = 'ar-MA';

  try {
    // Log the command for analytics
    await logCommand(input);

    switch (command) {
      case 'help':
        return handleHelp(geminiService, language);

      case 'confirm':
        return handleConfirm(sellerId, buyerPhone, args, geminiService, language);

      case 'cancel':
        return handleCancel(sellerId, buyerPhone, args, geminiService, language);

      case 'status':
        return handleStatus(sellerId, buyerPhone, args, geminiService, language);

      case 'track':
        return handleTrack(sellerId, buyerPhone, args, geminiService, language);

      case 'reorder':
        return handleReorder(sellerId, buyerPhone, args, geminiService, language);

      default:
        return {
          success: false,
          response: await geminiService.generateCommandResponse(
            'help',
            false,
            { error: 'Unknown command' },
            language
          ),
        };
    }
  } catch (error) {
    console.error('ProcessCommand error:', error);
    return {
      success: false,
      response: await geminiService.generateCommandResponse(
        command,
        false,
        { error: 'Internal error' },
        language
      ),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle /help command
 */
async function handleHelp(
  geminiService: GeminiAIService,
  language: 'ar-MA' | 'ar' | 'fr' | 'en'
): Promise<ProcessCommandResult> {
  const response = await geminiService.generateCommandResponse(
    'help',
    true,
    {},
    language
  );
  return { success: true, response };
}

/**
 * Handle /confirm command
 */
async function handleConfirm(
  sellerId: string,
  buyerPhone: string,
  args: Record<string, string>,
  geminiService: GeminiAIService,
  language: 'ar-MA' | 'ar' | 'fr' | 'en'
): Promise<ProcessCommandResult> {
  const orderNumber = args.orderNumber;

  if (!orderNumber) {
    // Try to find the buyer's latest pending order
    const latestOrder = await findLatestPendingOrder(sellerId, buyerPhone);
    if (latestOrder) {
      const success = await confirmOrder(latestOrder.id);
      return {
        success,
        response: await geminiService.generateCommandResponse(
          'confirm',
          success,
          { orderNumber: latestOrder.order_number },
          language
        ),
      };
    }

    return {
      success: false,
      response: await geminiService.generateCommandResponse(
        'confirm',
        false,
        { error: 'No order number provided' },
        language
      ),
    };
  }

  // Find the specific order
  const order = await findOrderByNumber(sellerId, orderNumber);
  if (!order) {
    return {
      success: false,
      response: await geminiService.generateCommandResponse(
        'confirm',
        false,
        { error: 'Order not found' },
        language
      ),
    };
  }

  const success = await confirmOrder(order.id);
  return {
    success,
    response: await geminiService.generateCommandResponse(
      'confirm',
      success,
      { orderNumber: order.order_number },
      language
    ),
  };
}

/**
 * Handle /cancel command
 */
async function handleCancel(
  sellerId: string,
  buyerPhone: string,
  args: Record<string, string>,
  geminiService: GeminiAIService,
  language: 'ar-MA' | 'ar' | 'fr' | 'en'
): Promise<ProcessCommandResult> {
  const orderNumber = args.orderNumber;

  if (!orderNumber) {
    return {
      success: false,
      response: await geminiService.generateCommandResponse(
        'cancel',
        false,
        { error: 'Order number required' },
        language
      ),
    };
  }

  const order = await findOrderByNumber(sellerId, orderNumber);
  if (!order) {
    return {
      success: false,
      response: await geminiService.generateCommandResponse(
        'cancel',
        false,
        { error: 'Order not found' },
        language
      ),
    };
  }

  // Can only cancel pending or confirmed orders
  if (!['pending', 'confirmed'].includes(order.status)) {
    return {
      success: false,
      response: await geminiService.generateCommandResponse(
        'cancel',
        false,
        { error: 'Cannot cancel this order' },
        language
      ),
    };
  }

  const success = await cancelOrder(order.id);
  return {
    success,
    response: await geminiService.generateCommandResponse(
      'cancel',
      success,
      { orderNumber: order.order_number },
      language
    ),
  };
}

/**
 * Handle /status command
 */
async function handleStatus(
  sellerId: string,
  buyerPhone: string,
  args: Record<string, string>,
  geminiService: GeminiAIService,
  language: 'ar-MA' | 'ar' | 'fr' | 'en'
): Promise<ProcessCommandResult> {
  const orderNumber = args.orderNumber;

  let order;
  if (orderNumber) {
    order = await findOrderByNumber(sellerId, orderNumber);
  } else {
    // Get latest order for this buyer
    order = await findLatestOrder(sellerId, buyerPhone);
  }

  if (!order) {
    return {
      success: false,
      response: await geminiService.generateCommandResponse(
        'status',
        false,
        { error: 'Order not found' },
        language
      ),
    };
  }

  const statusDisplay = STATUS_DISPLAY[language]?.[order.status] ||
    STATUS_DISPLAY['en'][order.status] ||
    order.status;

  return {
    success: true,
    response: await geminiService.generateCommandResponse(
      'status',
      true,
      {
        orderNumber: order.order_number,
        orderStatus: statusDisplay,
      },
      language
    ),
  };
}

/**
 * Handle /track command
 */
async function handleTrack(
  sellerId: string,
  buyerPhone: string,
  args: Record<string, string>,
  geminiService: GeminiAIService,
  language: 'ar-MA' | 'ar' | 'fr' | 'en'
): Promise<ProcessCommandResult> {
  const orderNumber = args.orderNumber;

  let order;
  if (orderNumber) {
    order = await findOrderByNumber(sellerId, orderNumber);
  } else {
    order = await findLatestOrder(sellerId, buyerPhone);
  }

  if (!order) {
    return {
      success: false,
      response: await geminiService.generateCommandResponse(
        'track',
        false,
        { error: 'Order not found' },
        language
      ),
    };
  }

  // Check if order has tracking info (from shipments table, when implemented)
  const trackingNumber = order.tracking_number || null;

  if (!trackingNumber) {
    return {
      success: false,
      response: await geminiService.generateCommandResponse(
        'track',
        false,
        { orderNumber: order.order_number },
        language
      ),
    };
  }

  return {
    success: true,
    response: await geminiService.generateCommandResponse(
      'track',
      true,
      {
        orderNumber: order.order_number,
        trackingNumber,
      },
      language
    ),
  };
}

/**
 * Handle /reorder command
 */
async function handleReorder(
  sellerId: string,
  buyerPhone: string,
  args: Record<string, string>,
  geminiService: GeminiAIService,
  language: 'ar-MA' | 'ar' | 'fr' | 'en'
): Promise<ProcessCommandResult> {
  const orderNumber = args.orderNumber;

  let order;
  if (orderNumber) {
    order = await findOrderByNumber(sellerId, orderNumber);
  } else {
    order = await findLatestDeliveredOrder(sellerId, buyerPhone);
  }

  if (!order) {
    return {
      success: false,
      response: await geminiService.generateCommandResponse(
        'reorder',
        false,
        { error: 'No previous order found' },
        language
      ),
    };
  }

  // Create a new order based on the previous one
  // For now, return a placeholder response
  // Full implementation would duplicate the order items
  return {
    success: true,
    response: await geminiService.generateCommandResponse(
      'reorder',
      true,
      { orderNumber: order.order_number },
      language
    ),
  };
}

// ============================================================
// Database Helper Functions (using Supabase)
// ============================================================

/**
 * Find order by order number and seller
 */
async function findOrderByNumber(sellerId: string, orderNumber: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .ilike('order_number', `%${orderNumber}%`)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Find latest pending order for a buyer
 */
async function findLatestPendingOrder(sellerId: string, buyerPhone: string) {
  try {
    const supabase = await createClient();
    const normalizedPhone = normalizePhone(buyerPhone);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('customer_phone', normalizedPhone)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Find latest order for a buyer (any status)
 */
async function findLatestOrder(sellerId: string, buyerPhone: string) {
  try {
    const supabase = await createClient();
    const normalizedPhone = normalizePhone(buyerPhone);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('customer_phone', normalizedPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Find latest delivered order for reordering
 */
async function findLatestDeliveredOrder(sellerId: string, buyerPhone: string) {
  try {
    const supabase = await createClient();
    const normalizedPhone = normalizePhone(buyerPhone);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('customer_phone', normalizedPhone)
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Confirm an order
 */
async function confirmOrder(orderId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('status', 'pending');

    return !error;
  } catch {
    return false;
  }
}

/**
 * Cancel an order
 */
async function cancelOrder(orderId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Log command for analytics
 */
async function logCommand(input: ProcessCommandInput): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from('whatsapp_commands').insert({
      seller_id: input.sellerId,
      buyer_phone: normalizePhone(input.buyerPhone),
      raw_message: input.rawMessage,
      parsed_command: input.command,
      command_args: input.args,
      execution_result: { pending: true },
    });
  } catch (error) {
    // Don't fail the command if logging fails
    console.error('Failed to log command:', error);
  }
}

/**
 * Normalize phone number for database lookup
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '');
}
