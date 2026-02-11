/**
 * WhatsApp Cloud API Service
 *
 * Handles all interactions with WhatsApp Business Cloud API including:
 * - OAuth authorization flow (via Facebook Login)
 * - Sending messages (templates and text)
 * - Webhook signature verification
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '@/infrastructure/utils/logger';

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';
const FACEBOOK_OAUTH_BASE = 'https://www.facebook.com/v18.0/dialog/oauth';
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';

// OAuth Scopes required for WhatsApp Business API
const WHATSAPP_SCOPES = [
  'whatsapp_business_management',
  'whatsapp_business_messaging',
  'business_management',
].join(',');

export interface WhatsAppTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface WhatsAppBusinessAccount {
  id: string;
  name: string;
  currency: string;
  timezone_id: string;
}

export interface WhatsAppPhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating: string;
  code_verification_status: string;
}

export interface SendMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters?: Array<{
    type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
    text?: string;
    currency?: {
      fallback_value: string;
      code: string;
      amount_1000: number;
    };
    date_time?: {
      fallback_value: string;
    };
    image?: {
      link: string;
    };
  }>;
  sub_type?: 'quick_reply' | 'url';
  index?: number;
}

export interface WebhookMessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
}

export interface WebhookIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'button' | 'reaction';
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
  };
  button?: {
    payload: string;
    text: string;
  };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
}

export class WhatsAppCloudApiService {
  private appId: string;
  private appSecret: string;
  private redirectUri: string;
  private verifyToken: string;

  constructor() {
    const appId = process.env.WHATSAPP_APP_ID;
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const redirectUri = process.env.WHATSAPP_REDIRECT_URI;
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (!appId) {
      throw new Error('WHATSAPP_APP_ID is not set');
    }
    if (!appSecret) {
      throw new Error('WHATSAPP_APP_SECRET is not set');
    }
    if (!redirectUri) {
      throw new Error('WHATSAPP_REDIRECT_URI is not set');
    }

    this.appId = appId;
    this.appSecret = appSecret;
    this.redirectUri = redirectUri;
    this.verifyToken = verifyToken || '';
  }

  /**
   * Generate the Facebook OAuth authorization URL for WhatsApp Business
   *
   * @param state - CSRF protection token (store in cookie/session)
   * @returns URL to redirect user to for authorization
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: WHATSAPP_SCOPES,
      response_type: 'code',
      state,
    });

    return `${FACEBOOK_OAUTH_BASE}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   *
   * @param code - Authorization code from OAuth callback
   * @returns Access token
   */
  async exchangeCodeForToken(code: string): Promise<WhatsAppTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.redirectUri,
      code,
    });

    const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to exchange code: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get WhatsApp Business Accounts for the user
   *
   * @param accessToken - User's access token
   * @returns List of WhatsApp Business Accounts
   */
  async getBusinessAccounts(accessToken: string): Promise<WhatsAppBusinessAccount[]> {
    const response = await fetch(
      `${GRAPH_API_BASE}/me/businesses?fields=id,name&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get business accounts: ${error.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get WhatsApp Business Account linked to a business
   *
   * @param businessId - Facebook Business ID
   * @param accessToken - User's access token
   * @returns WhatsApp Business Account
   */
  async getWhatsAppBusinessAccount(
    businessId: string,
    accessToken: string
  ): Promise<WhatsAppBusinessAccount | null> {
    const response = await fetch(
      `${GRAPH_API_BASE}/${businessId}/owned_whatsapp_business_accounts?fields=id,name,currency,timezone_id&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get WhatsApp business account: ${error.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    return data.data?.[0] || null;
  }

  /**
   * Get phone numbers for a WhatsApp Business Account
   *
   * @param wabaId - WhatsApp Business Account ID
   * @param accessToken - User's access token
   * @returns List of phone numbers
   */
  async getPhoneNumbers(
    wabaId: string,
    accessToken: string
  ): Promise<WhatsAppPhoneNumber[]> {
    const response = await fetch(
      `${GRAPH_API_BASE}/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get phone numbers: ${error.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Send a template message
   *
   * @param phoneNumberId - Sender's phone number ID
   * @param accessToken - Access token
   * @param recipientPhone - Recipient's phone number (with country code, no +)
   * @param templateName - Name of the approved template
   * @param languageCode - Template language code (e.g., 'ar', 'en')
   * @param components - Template components with dynamic values
   * @returns Send message response
   */
  async sendTemplateMessage(
    phoneNumberId: string,
    accessToken: string,
    recipientPhone: string,
    templateName: string,
    languageCode: string = 'ar',
    components?: TemplateComponent[]
  ): Promise<SendMessageResponse> {
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    };

    if (components && components.length > 0) {
      (body.template as Record<string, unknown>).components = components;
    }

    const response = await fetch(
      `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to send template message: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Send a text message (only within 24-hour window after user message)
   *
   * @param phoneNumberId - Sender's phone number ID
   * @param accessToken - Access token
   * @param recipientPhone - Recipient's phone number
   * @param text - Message text
   * @param previewUrl - Whether to show URL previews
   * @returns Send message response
   */
  async sendTextMessage(
    phoneNumberId: string,
    accessToken: string,
    recipientPhone: string,
    text: string,
    previewUrl: boolean = false
  ): Promise<SendMessageResponse> {
    const body = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'text',
      text: {
        preview_url: previewUrl,
        body: text,
      },
    };

    const response = await fetch(
      `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to send text message: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Mark a message as read
   *
   * @param phoneNumberId - Phone number ID
   * @param accessToken - Access token
   * @param messageId - WhatsApp message ID to mark as read
   */
  async markAsRead(
    phoneNumberId: string,
    accessToken: string,
    messageId: string
  ): Promise<void> {
    const body = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    const response = await fetch(
      `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to mark message as read: ${error.error?.message || response.statusText}`
      );
    }
  }

  /**
   * Verify webhook signature
   *
   * @param payload - Raw request body (as string)
   * @param signature - X-Hub-Signature-256 header value
   * @returns true if signature is valid
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!signature || !signature.startsWith('sha256=')) {
      return false;
    }

    const expectedSignature = signature.slice(7); // Remove 'sha256=' prefix

    const hmac = createHmac('sha256', this.appSecret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    try {
      return timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(calculatedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Verify webhook challenge (for webhook registration)
   *
   * @param mode - hub.mode query parameter
   * @param token - hub.verify_token query parameter
   * @param challenge - hub.challenge query parameter
   * @returns challenge value if verification succeeds, null otherwise
   */
  verifyWebhookChallenge(
    mode: string | null,
    token: string | null,
    challenge: string | null
  ): string | null {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Parse incoming webhook notification
   *
   * @param body - Webhook request body
   * @returns Parsed message status updates and incoming messages
   */
  parseWebhookPayload(body: Record<string, unknown>): {
    statusUpdates: WebhookMessageStatus[];
    incomingMessages: WebhookIncomingMessage[];
    phoneNumberId?: string;
  } {
    const statusUpdates: WebhookMessageStatus[] = [];
    const incomingMessages: WebhookIncomingMessage[] = [];
    let phoneNumberId: string | undefined;

    const entry = (body.entry as Array<Record<string, unknown>>) || [];

    for (const e of entry) {
      const changes = (e.changes as Array<Record<string, unknown>>) || [];

      for (const change of changes) {
        const value = change.value as Record<string, unknown>;

        if (value?.metadata) {
          phoneNumberId = (value.metadata as Record<string, unknown>).phone_number_id as string;
        }

        // Status updates
        const statuses = (value?.statuses as Array<Record<string, unknown>>) || [];
        for (const status of statuses) {
          statusUpdates.push({
            id: status.id as string,
            status: status.status as 'sent' | 'delivered' | 'read' | 'failed',
            timestamp: status.timestamp as string,
            recipient_id: status.recipient_id as string,
            errors: status.errors as WebhookMessageStatus['errors'],
          });
        }

        // Incoming messages
        const messages = (value?.messages as Array<Record<string, unknown>>) || [];
        for (const message of messages) {
          incomingMessages.push(message as unknown as WebhookIncomingMessage);
        }
      }
    }

    return { statusUpdates, incomingMessages, phoneNumberId };
  }

  // ===========================================
  // Message Template Management Methods
  // ===========================================

  /**
   * Create a message template in Meta
   *
   * @param wabaId - WhatsApp Business Account ID
   * @param accessToken - Access token
   * @param template - Template data
   * @returns Created template ID
   */
  async createMessageTemplate(
    wabaId: string,
    accessToken: string,
    template: {
      name: string;
      language: string;
      category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
      components: Array<{
        type: string;
        format?: string;
        text?: string;
        buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>;
        example?: Record<string, unknown>;
      }>;
    }
  ): Promise<{ id: string; status: string }> {
    // Meta API requires allow_category_change for certain transitions
    const payload = {
      ...template,
      allow_category_change: true,
    };

    logger.debug('[WhatsApp] Creating template', { context: 'whatsapp', templateName: template.name });

    const response = await fetch(`${GRAPH_API_BASE}/${wabaId}/message_templates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[WhatsApp] Template creation failed:', JSON.stringify(error, null, 2));

      // Extract detailed error message
      const errorMessage = error.error?.error_user_msg
        || error.error?.message
        || error.error?.error_data?.details
        || response.statusText;

      throw new Error(`Failed to create message template: ${errorMessage}`);
    }

    const result = await response.json();
    logger.debug('[WhatsApp] Template created', { context: 'whatsapp', templateId: result.id, status: result.status });
    return result;
  }

  /**
   * List all message templates for a WhatsApp Business Account
   *
   * @param wabaId - WhatsApp Business Account ID
   * @param accessToken - Access token
   * @param options - Query options
   * @returns List of templates
   */
  async getMessageTemplates(
    wabaId: string,
    accessToken: string,
    options?: {
      status?: 'APPROVED' | 'PENDING' | 'REJECTED';
      limit?: number;
    }
  ): Promise<{
    data: Array<{
      id: string;
      name: string;
      status: string;
      category: string;
      language: string;
      components: unknown[];
      rejected_reason?: string;
    }>;
    paging?: {
      cursors: { before: string; after: string };
      next?: string;
    };
  }> {
    const params = new URLSearchParams({
      fields: 'id,name,status,category,language,components,rejected_reason',
    });

    if (options?.status) {
      params.set('status', options.status);
    }
    if (options?.limit) {
      params.set('limit', options.limit.toString());
    }

    const response = await fetch(
      `${GRAPH_API_BASE}/${wabaId}/message_templates?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get message templates: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get a specific message template by ID
   *
   * @param templateId - Meta template ID
   * @param accessToken - Access token
   * @returns Template details
   */
  async getMessageTemplateById(
    templateId: string,
    accessToken: string
  ): Promise<{
    id: string;
    name: string;
    status: string;
    category: string;
    language: string;
    components: unknown[];
    rejected_reason?: string;
  }> {
    const response = await fetch(
      `${GRAPH_API_BASE}/${templateId}?fields=id,name,status,category,language,components,rejected_reason`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get message template: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Delete a message template by name
   *
   * Note: This deletes ALL templates with the given name across all languages.
   * To delete a specific language version, use deleteMessageTemplateByNameAndLanguage.
   *
   * @param wabaId - WhatsApp Business Account ID
   * @param accessToken - Access token
   * @param templateName - Template name
   * @returns Success status
   */
  async deleteMessageTemplate(
    wabaId: string,
    accessToken: string,
    templateName: string
  ): Promise<{ success: boolean }> {
    const params = new URLSearchParams({
      name: templateName,
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/${wabaId}/message_templates?${params.toString()}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to delete message template: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Delete a specific message template by ID
   *
   * @param templateId - Meta template ID
   * @param accessToken - Access token
   * @returns Success status
   */
  async deleteMessageTemplateById(
    templateId: string,
    accessToken: string
  ): Promise<{ success: boolean }> {
    const response = await fetch(`${GRAPH_API_BASE}/${templateId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to delete message template: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }
}
