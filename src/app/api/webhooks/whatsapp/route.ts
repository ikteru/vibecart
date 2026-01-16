import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WhatsAppCommandParser } from '@/infrastructure/external-services/WhatsAppCommandParser';
import { processWhatsAppCommand } from '@/application/use-cases/whatsapp/ProcessCommand';

/**
 * WhatsApp Slash Commands Webhook
 *
 * Discord-style "/" commands for AI-powered order management.
 * Bypasses WhatsApp Business API templates and delays.
 *
 * Available commands:
 * /confirm [order_number] - Confirm an order
 * /cancel [order_number]  - Cancel an order
 * /status [order_number]  - Check order status
 * /track [order_number]   - Get tracking info
 * /help                   - List available commands
 * /reorder [order_number] - Reorder previous items
 */

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
    const payload: WhatsAppWebhookPayload = await request.json();

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

// GET - Webhook verification (for future WhatsApp Cloud API integration)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify webhook for WhatsApp Cloud API
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: 'WhatsApp Webhook Active' });
}
