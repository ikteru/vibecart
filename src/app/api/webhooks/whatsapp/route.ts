import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WhatsAppCommandParser } from '@/infrastructure/external-services/WhatsAppCommandParser';
import { WhatsAppCloudApiService } from '@/infrastructure/external-services/WhatsAppCloudApiService';
import { processWhatsAppCommand } from '@/application/use-cases/whatsapp/ProcessCommand';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';
import { createRepositories } from '@/infrastructure/persistence/supabase';

/**
 * WhatsApp Webhook Handler
 *
 * Handles both:
 * 1. WhatsApp Cloud API webhooks (with signature verification)
 *    - Message status updates (sent, delivered, read)
 *    - Incoming messages
 * 2. Custom slash commands from external gateway (legacy format)
 *
 * Available slash commands:
 * /confirm [order_number] - Confirm an order
 * /cancel [order_number]  - Cancel an order
 * /status [order_number]  - Check order status
 * /track [order_number]   - Get tracking info
 * /help                   - List available commands
 * /reorder [order_number] - Reorder previous items
 */

// Legacy custom payload format (for backwards compatibility)
export interface WhatsAppWebhookPayload {
  sellerId: string;
  buyerPhone: string;
  message: string;
  timestamp?: string;
}

export interface WhatsAppWebhookResponse {
  success: boolean;
  response?: string;
  command?: string;
  error?: string;
}

// POST - Receive incoming WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Check if this is a WhatsApp Cloud API webhook (has signature)
    if (signature) {
      return handleCloudApiWebhook(rawBody, signature);
    }

    // Otherwise, handle legacy custom payload format
    const payload: WhatsAppWebhookPayload = JSON.parse(rawBody);
    return handleLegacyWebhook(payload);

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET - Webhook verification for WhatsApp Cloud API
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify webhook for WhatsApp Cloud API
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: 'WhatsApp Webhook Active' });
}

/**
 * Handle WhatsApp Cloud API webhooks with signature verification
 */
async function handleCloudApiWebhook(
  rawBody: string,
  signature: string
): Promise<NextResponse> {
  try {
    // Verify signature
    const whatsAppService = new WhatsAppCloudApiService();
    const isValid = whatsAppService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error('Invalid WhatsApp webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody);

    // Parse the webhook payload
    const { statusUpdates, incomingMessages, phoneNumberId } =
      whatsAppService.parseWebhookPayload(body);

    // Handle status updates
    if (statusUpdates.length > 0) {
      await handleStatusUpdates(statusUpdates);
    }

    // Handle incoming messages (optional: process replies)
    if (incomingMessages.length > 0) {
      await handleIncomingMessages(incomingMessages, phoneNumberId);
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('WhatsApp Cloud API webhook error:', error);
    // Still return 200 to prevent webhook retries
    return NextResponse.json({ success: true });
  }
}

/**
 * Handle message status updates (sent, delivered, read)
 */
async function handleStatusUpdates(
  statusUpdates: Array<{
    id: string;
    status: string;
    timestamp: string;
    recipient_id: string;
    errors?: Array<{ code: number; title: string; message: string }>;
  }>
): Promise<void> {
  const adminClient = createAdminClient();
  const { whatsAppMessageRepository } = createRepositories(adminClient);

  for (const update of statusUpdates) {
    try {
      // Find message by WhatsApp message ID
      const message = await whatsAppMessageRepository.findByWhatsAppMessageId(update.id);

      if (!message) {
        // Message not found - might be from a different system
        continue;
      }

      // Map status to our status enum
      let newStatus: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
      switch (update.status) {
        case 'sent':
          newStatus = 'SENT';
          break;
        case 'delivered':
          newStatus = 'DELIVERED';
          break;
        case 'read':
          newStatus = 'READ';
          break;
        case 'failed':
          newStatus = 'FAILED';
          break;
        default:
          continue;
      }

      const timestamp = new Date(parseInt(update.timestamp) * 1000);

      // Update the message status
      await whatsAppMessageRepository.updateStatus(message.id, newStatus, {
        timestamp,
        errorCode: update.errors?.[0]?.code?.toString(),
        errorMessage: update.errors?.[0]?.message,
      });

      console.log(`Updated WhatsApp message ${update.id} status to ${newStatus}`);
    } catch (error) {
      console.error(`Failed to update status for message ${update.id}:`, error);
    }
  }
}

/**
 * Handle incoming messages (customer replies)
 */
async function handleIncomingMessages(
  messages: Array<{
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
  }>,
  _phoneNumberId?: string
): Promise<void> {
  // For now, just log incoming messages
  // In the future, this could:
  // 1. Route to customer support
  // 2. Process as slash commands
  // 3. Trigger automated responses

  for (const message of messages) {
    console.log('Incoming WhatsApp message:', {
      from: message.from,
      id: message.id,
      type: message.type,
      text: message.text?.body,
    });

    // If it's a text message that looks like a command, process it
    if (message.type === 'text' && message.text?.body?.startsWith('/')) {
      // TODO: Route to command processing
      // Would need to map phone number to seller
    }
  }
}

/**
 * Handle legacy custom webhook format (slash commands)
 */
async function handleLegacyWebhook(
  payload: WhatsAppWebhookPayload
): Promise<NextResponse> {
  // Validate required fields
  if (!payload.sellerId || !payload.buyerPhone || !payload.message) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required fields: sellerId, buyerPhone, message'
      },
      { status: 400 }
    );
  }

  // Parse the command from the message
  const parser = new WhatsAppCommandParser();
  const parsedCommand = await parser.parse(payload.message);

  // If no command detected, return acknowledgment
  if (!parsedCommand.isCommand) {
    return NextResponse.json({
      success: true,
      response: null,
      command: null,
    });
  }

  // Process the command
  const result = await processWhatsAppCommand({
    sellerId: payload.sellerId,
    buyerPhone: payload.buyerPhone,
    rawMessage: payload.message,
    command: parsedCommand.command!,
    args: parsedCommand.args,
  });

  return NextResponse.json({
    success: result.success,
    response: result.response,
    command: parsedCommand.command,
    error: result.error,
  });
}
