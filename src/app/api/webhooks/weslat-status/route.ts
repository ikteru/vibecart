/**
 * Weslat Status Callback Webhook
 *
 * Receives delivery status updates from Weslat broker service.
 * Updates the local whatsapp_messages table with SENT/DELIVERED/READ/FAILED status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { WeslatBrokerService } from '@/infrastructure/external-services/WeslatBrokerService';
import type { WeslatStatusCallbackPayload } from '@/infrastructure/external-services/WeslatBrokerService';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify HMAC signature
    const signature = request.headers.get('x-weslat-signature');
    const rawBody = await request.text();

    const callbackSecret = process.env.WESLAT_CALLBACK_SECRET;
    if (!callbackSecret) {
      console.error('WESLAT_CALLBACK_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (!signature || !WeslatBrokerService.verifyCallbackSignature(signature, rawBody, callbackSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse payload
    const payload: WeslatStatusCallbackPayload = JSON.parse(rawBody);

    // 3. Extract VibeCart message ID from metadata
    const vibecartMessageId = payload.metadata?.vibecart_message_id as string | undefined;
    if (!vibecartMessageId) {
      // Not a VibeCart message — acknowledge but ignore
      return NextResponse.json({ processed: true, action: 'ignored' });
    }

    // 4. Map Weslat status to VibeCart status update
    const supabase = createAdminClient();

    const statusMap: Record<string, string> = {
      SENT: 'SENT',
      DELIVERED: 'DELIVERED',
      READ: 'READ',
      FAILED: 'FAILED',
    };

    const mappedStatus = statusMap[payload.status];
    if (!mappedStatus) {
      return NextResponse.json({ processed: true, action: 'unknown_status' });
    }

    // 5. Build update data
    const updateData: Record<string, unknown> = {
      status: mappedStatus,
    };

    // Update the WA message ID if we have it (replaces the weslat: prefix)
    if (payload.waMessageId) {
      updateData.whatsapp_message_id = payload.waMessageId;
    }

    // Set timestamps based on status
    const now = new Date().toISOString();
    switch (mappedStatus) {
      case 'SENT':
        updateData.sent_at = now;
        break;
      case 'DELIVERED':
        updateData.delivered_at = now;
        break;
      case 'READ':
        updateData.read_at = now;
        break;
      case 'FAILED':
        updateData.error_code = payload.errorCode || null;
        updateData.error_message = payload.errorMessage || null;
        break;
    }

    // 6. Update the message record
    const { error } = await supabase
      .from('whatsapp_messages')
      .update(updateData)
      .eq('id', vibecartMessageId);

    if (error) {
      console.error('Failed to update message status:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({
      processed: true,
      action: 'status_updated',
      messageId: vibecartMessageId,
      newStatus: mappedStatus,
    });
  } catch (error) {
    console.error('Weslat status callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
