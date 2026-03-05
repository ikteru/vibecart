/**
 * Weslat Broker Service
 *
 * HTTP client for the Weslat WhatsApp message broker.
 * Routes outbound messages through Weslat's queue instead of calling Meta directly.
 */

import { createHmac } from 'crypto';

interface WeslatSendMessageInput {
  apiKey: string;
  templateName: string;
  recipient: string; // E.164 format
  templateParams: string[];
  metadata?: Record<string, unknown>;
  scheduledAt?: Date;
}

interface WeslatSendMessageOutput {
  messageId: string;
  status: 'queued' | 'scheduled';
}

interface WeslatStatusCallbackPayload {
  messageId: string;
  waMessageId?: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  errorCode?: string;
  errorMessage?: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export class WeslatBrokerService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.WESLAT_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Send a template message via Weslat's message queue.
   * Returns 202 Accepted with a Weslat message ID for tracking.
   */
  async sendMessage(input: WeslatSendMessageInput): Promise<WeslatSendMessageOutput> {
    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': input.apiKey,
      },
      body: JSON.stringify({
        templateName: input.templateName,
        recipient: input.recipient,
        templateParams: input.templateParams,
        metadata: input.metadata,
        scheduledAt: input.scheduledAt?.toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(
        `Weslat API error (${response.status}): ${error.message || error.error || 'Failed to send message'}`
      );
    }

    const result = await response.json();
    return {
      messageId: result.messageId,
      status: result.status,
    };
  }

  /**
   * Register a seller's WhatsApp channel in Weslat.
   * Called when a seller connects their own WhatsApp Business number.
   */
  async registerSellerChannel(input: {
    tenantId: string;
    name: string;
    phoneNumber: string;
    phoneNumberId: string;
    wabaId: string;
    accessToken: string;
    statusCallbackUrl: string;
    statusCallbackSecret: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ channelId: string; apiKey: string }> {
    const response = await fetch(`${this.baseUrl}/admin/channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantId: input.tenantId,
        name: input.name,
        phoneNumber: input.phoneNumber,
        phoneNumberId: input.phoneNumberId,
        wabaId: input.wabaId,
        accessToken: input.accessToken,
        statusCallbackUrl: input.statusCallbackUrl,
        statusCallbackSecret: input.statusCallbackSecret,
        metadata: input.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(
        `Weslat channel registration failed (${response.status}): ${error.error || 'Unknown error'}`
      );
    }

    const result = await response.json();
    return {
      channelId: result.id,
      apiKey: result.apiKey,
    };
  }

  /**
   * Verify the HMAC signature on a Weslat status callback.
   */
  static verifyCallbackSignature(
    signature: string,
    body: string,
    secret: string,
  ): boolean {
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    return signature === expected;
  }
}

export type { WeslatSendMessageInput, WeslatSendMessageOutput, WeslatStatusCallbackPayload };
