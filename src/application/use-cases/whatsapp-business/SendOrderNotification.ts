/**
 * Send Order Notification Use Case
 *
 * Sends WhatsApp template messages for order status updates.
 * Supports two paths:
 * - Weslat broker (default): Routes through Weslat's message queue for reliable delivery
 * - Direct Meta API (legacy): Calls Meta Graph API directly per seller token
 *
 * Controlled by USE_WESLAT_BROKER env var.
 */

import { WhatsAppCloudApiService, TemplateComponent } from '@/infrastructure/external-services/WhatsAppCloudApiService';
import { WeslatBrokerService } from '@/infrastructure/external-services/WeslatBrokerService';
import { ResolveMessagingChannel } from './ResolveMessagingChannel';
import { WhatsAppMessage } from '@/domain/entities/WhatsAppMessage';
import { decryptWhatsAppToken } from '@/infrastructure/utils/encryption';
import type { WhatsAppTokenRepository } from '@/domain/repositories/WhatsAppTokenRepository';
import type { WhatsAppMessageRepository } from '@/domain/repositories/WhatsAppMessageRepository';
import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import type { TemplateEventBindingRepository } from '@/domain/repositories/TemplateEventBindingRepository';
import type { SellerWeslatChannelRepository } from '@/domain/repositories/SellerWeslatChannelRepository';
import type { NotificationEventType } from '@/domain/entities/TemplateEventBinding';

export type NotificationType = NotificationEventType;

interface SendOrderNotificationInput {
  orderId: string;
  notificationType: NotificationType;
}

interface SendOrderNotificationOutput {
  success: boolean;
  messageId?: string;
  error?: string;
}

// System default template names (used when seller has no custom template assigned)
const SYSTEM_TEMPLATE_NAMES: Record<NotificationType, string> = {
  ORDER_PENDING_CONFIRMATION: 'order_pending_confirmation',
  ORDER_CONFIRMED: 'order_confirmation',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
};

export class SendOrderNotification {
  private whatsAppService: WhatsAppCloudApiService;
  private weslatBroker: WeslatBrokerService;
  private resolveChannel: ResolveMessagingChannel;
  private whatsAppTokenRepository: WhatsAppTokenRepository;
  private whatsAppMessageRepository: WhatsAppMessageRepository;
  private orderRepository: OrderRepository;
  private templateEventBindingRepository?: TemplateEventBindingRepository;

  constructor(
    whatsAppTokenRepository: WhatsAppTokenRepository,
    whatsAppMessageRepository: WhatsAppMessageRepository,
    orderRepository: OrderRepository,
    templateEventBindingRepository?: TemplateEventBindingRepository,
    sellerWeslatChannelRepository?: SellerWeslatChannelRepository
  ) {
    this.whatsAppService = new WhatsAppCloudApiService();
    this.weslatBroker = new WeslatBrokerService();
    this.resolveChannel = new ResolveMessagingChannel(sellerWeslatChannelRepository);
    this.whatsAppTokenRepository = whatsAppTokenRepository;
    this.whatsAppMessageRepository = whatsAppMessageRepository;
    this.orderRepository = orderRepository;
    this.templateEventBindingRepository = templateEventBindingRepository;
  }

  private get useWeslat(): boolean {
    return process.env.USE_WESLAT_BROKER === 'true';
  }

  async execute(input: SendOrderNotificationInput): Promise<SendOrderNotificationOutput> {
    if (this.useWeslat) {
      return this.executeViaWeslat(input);
    }
    return this.executeDirectMeta(input);
  }

  /**
   * Send notification via Weslat broker (new path).
   * Works for all sellers — uses shared platform number by default,
   * or seller's own number if they've connected one.
   */
  private async executeViaWeslat(input: SendOrderNotificationInput): Promise<SendOrderNotificationOutput> {
    try {
      // 1. Get order details
      const order = await this.orderRepository.findById(input.orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // 2. Resolve which channel to use (platform shared or seller's own)
      const channel = await this.resolveChannel.execute(order.sellerId);

      // 3. Get customer phone in E.164 format
      const customerPhone = order.customerPhone.toWhatsAppFormat();

      // 4. Resolve template name and params
      let templateName: string;
      let templateParams: string[];

      const customTemplate = await this.getSellerAssignedTemplate(
        order.sellerId,
        input.notificationType
      );

      if (customTemplate) {
        templateName = customTemplate.templateName;
        templateParams = this.extractTemplateParams(customTemplate.components, order);
      } else {
        templateName = SYSTEM_TEMPLATE_NAMES[input.notificationType];
        const components = this.buildDefaultTemplateComponents(input.notificationType, order);
        templateParams = this.flattenComponentsToParams(components);
      }

      // 5. Create local message record
      const message = WhatsAppMessage.create({
        sellerId: order.sellerId,
        orderId: order.id,
        recipientPhone: customerPhone,
        templateName,
        messageType: 'template',
        messageContent: {
          notificationType: input.notificationType,
          channelType: channel.type,
        },
      });

      await this.whatsAppMessageRepository.create(message);

      // 6. Send via Weslat
      const result = await this.weslatBroker.sendMessage({
        apiKey: channel.weslatApiKey,
        templateName,
        recipient: customerPhone,
        templateParams,
        metadata: {
          vibecart_order_id: order.id,
          vibecart_seller_id: order.sellerId,
          vibecart_notification_type: input.notificationType,
          vibecart_message_id: message.id,
        },
      });

      // 7. Update message with Weslat message ID (WA message ID comes later via callback)
      await this.whatsAppMessageRepository.updateStatus(message.id, 'PENDING', {
        whatsappMessageId: `weslat:${result.messageId}`,
        timestamp: new Date(),
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Send order notification (Weslat) error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  /**
   * Send notification directly via Meta Cloud API (legacy path).
   * Requires seller to have connected their own WhatsApp Business account.
   */
  private async executeDirectMeta(input: SendOrderNotificationInput): Promise<SendOrderNotificationOutput> {
    try {
      // 1. Get order details
      const order = await this.orderRepository.findById(input.orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // 2. Get seller's WhatsApp token
      const token = await this.whatsAppTokenRepository.findBySellerId(order.sellerId);
      if (!token || !token.isActive) {
        return { success: false, error: 'WhatsApp Business not connected for this seller' };
      }

      if (token.isExpired()) {
        return { success: false, error: 'WhatsApp token has expired. Please reconnect.' };
      }

      // 3. Decrypt access token
      const accessToken = decryptWhatsAppToken(token.accessTokenEncrypted);

      // 4. Get customer phone
      const customerPhone = order.customerPhone.toWhatsAppFormat();

      // 5. Get template
      let templateName: string;
      let languageCode: string;
      let components: TemplateComponent[];

      const customTemplate = await this.getSellerAssignedTemplate(
        order.sellerId,
        input.notificationType
      );

      if (customTemplate) {
        templateName = customTemplate.templateName;
        languageCode = customTemplate.templateLanguage;
        components = this.buildCustomTemplateComponents(customTemplate.components, order);
      } else {
        templateName = SYSTEM_TEMPLATE_NAMES[input.notificationType];
        languageCode = 'ar';
        components = this.buildDefaultTemplateComponents(input.notificationType, order);
      }

      // 6. Create message record
      const message = WhatsAppMessage.create({
        sellerId: order.sellerId,
        orderId: order.id,
        recipientPhone: customerPhone,
        templateName,
        messageType: 'template',
        messageContent: { notificationType: input.notificationType, components },
      });

      await this.whatsAppMessageRepository.create(message);

      // 7. Send
      const response = await this.whatsAppService.sendTemplateMessage(
        token.phoneNumberId, accessToken, customerPhone,
        templateName, languageCode, components
      );

      // 8. Update status
      const whatsappMessageId = response.messages[0]?.id;
      if (whatsappMessageId) {
        await this.whatsAppMessageRepository.updateStatus(message.id, 'SENT', {
          whatsappMessageId, timestamp: new Date(),
        });
      }

      return { success: true, messageId: whatsappMessageId };
    } catch (error) {
      console.error('Send order notification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  /**
   * Get seller's assigned template for a notification event.
   */
  private async getSellerAssignedTemplate(
    sellerId: string,
    eventType: NotificationType
  ): Promise<{
    templateName: string;
    templateLanguage: string;
    components: unknown[];
  } | null> {
    if (!this.templateEventBindingRepository) {
      return null;
    }

    const result = await this.templateEventBindingRepository.getActiveBindingWithTemplate(
      sellerId,
      eventType
    );

    if (!result) {
      return null;
    }

    return {
      templateName: result.templateName,
      templateLanguage: result.templateLanguage,
      components: result.components,
    };
  }

  /**
   * Flatten TemplateComponent[] into a flat string[] for Weslat's API.
   */
  private flattenComponentsToParams(components: TemplateComponent[]): string[] {
    const params: string[] = [];
    for (const comp of components) {
      if (comp.parameters) {
        for (const param of comp.parameters) {
          params.push(param.text || '');
        }
      }
    }
    return params;
  }

  /**
   * Extract template params from a custom template's components for Weslat.
   */
  private extractTemplateParams(
    templateComponents: unknown[],
    order: { orderNumber: string; customerName: string; trackingNumber?: string | null; total?: { amount: number; currency: string } }
  ): string[] {
    const variableValues: Record<string, string> = {
      '1': order.customerName,
      '2': order.orderNumber,
      '3': order.total ? `${order.total.amount} ${order.total.currency}` : '0 MAD',
      '4': order.trackingNumber || 'N/A',
      '5': '',
      '6': '1',
    };

    const params: string[] = [];
    for (const comp of templateComponents as Array<{ type: string; text?: string }>) {
      if (comp.type === 'BODY' && comp.text) {
        const pattern = /\{\{(\d+)\}\}/g;
        let match;
        while ((match = pattern.exec(comp.text)) !== null) {
          params.push(variableValues[match[1]] || '');
        }
      }
    }
    return params;
  }

  /**
   * Build template components from a custom template's component definition.
   */
  private buildCustomTemplateComponents(
    templateComponents: unknown[],
    order: { orderNumber: string; customerName: string; trackingNumber?: string | null; total?: { amount: number; currency: string } }
  ): TemplateComponent[] {
    const components: TemplateComponent[] = [];

    const variableValues: Record<string, string> = {
      '1': order.customerName,
      '2': order.orderNumber,
      '3': order.total ? `${order.total.amount} ${order.total.currency}` : '0 MAD',
      '4': order.trackingNumber || 'N/A',
      '5': '',
      '6': '1',
    };

    for (const comp of templateComponents as Array<{ type: string; text?: string }>) {
      if (comp.type === 'BODY' && comp.text) {
        const pattern = /\{\{(\d+)\}\}/g;
        const parameters: Array<{ type: 'text'; text: string }> = [];
        let match;

        while ((match = pattern.exec(comp.text)) !== null) {
          const varNum = match[1];
          parameters.push({
            type: 'text',
            text: variableValues[varNum] || '',
          });
        }

        if (parameters.length > 0) {
          components.push({ type: 'body', parameters });
        }
      }
    }

    return components;
  }

  /**
   * Build template components for system default templates.
   */
  private buildDefaultTemplateComponents(
    notificationType: NotificationType,
    order: { orderNumber: string; customerName: string; trackingNumber?: string | null; total?: { amount: number; currency: string } }
  ): TemplateComponent[] {
    const components: TemplateComponent[] = [];

    switch (notificationType) {
      case 'ORDER_PENDING_CONFIRMATION':
        components.push({
          type: 'body',
          parameters: [
            { type: 'text', text: order.customerName },
            { type: 'text', text: order.orderNumber },
            { type: 'text', text: order.total ? `${order.total.amount}` : '0' },
          ],
        });
        break;

      case 'ORDER_CONFIRMED':
        components.push({
          type: 'body',
          parameters: [
            { type: 'text', text: order.customerName },
            { type: 'text', text: order.orderNumber },
          ],
        });
        break;

      case 'ORDER_SHIPPED':
        components.push({
          type: 'body',
          parameters: [
            { type: 'text', text: order.orderNumber },
            { type: 'text', text: order.trackingNumber || 'N/A' },
          ],
        });
        break;

      case 'ORDER_DELIVERED':
        components.push({
          type: 'body',
          parameters: [
            { type: 'text', text: order.orderNumber },
          ],
        });
        break;

      case 'ORDER_CANCELLED':
        components.push({
          type: 'body',
          parameters: [
            { type: 'text', text: order.orderNumber },
          ],
        });
        break;
    }

    return components;
  }

  /**
   * Send pending confirmation as text message (fallback for testing)
   * Note: Text messages only work within 24-hour window after customer initiates contact
   */
  async sendPendingConfirmationText(orderId: string): Promise<SendOrderNotificationOutput> {
    try {
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      const token = await this.whatsAppTokenRepository.findBySellerId(order.sellerId);
      if (!token || !token.isActive) {
        return { success: false, error: 'WhatsApp Business not connected' };
      }

      if (token.isExpired()) {
        return { success: false, error: 'WhatsApp token has expired' };
      }

      const accessToken = decryptWhatsAppToken(token.accessTokenEncrypted);
      const customerPhone = order.customerPhone.toWhatsAppFormat();

      const textMessage = order.isPickup
        ? `مرحباً ${order.customerName}! 🏪

✅ تم استلام طلب الاستلام من المحل رقم *${order.orderNumber}*
💰 المجموع: ${order.total.amount} درهم (بدون تكلفة التوصيل)
🔑 كود الاستلام: *${order.pickupCode}*

سيتم إعلامك عندما يكون طلبك جاهزا ✨`
        : `مرحباً ${order.customerName}!

تم استلام طلبك رقم ${order.orderNumber}
المجموع: ${order.total.amount} درهم

للتأكيد، أرسل 1
للإلغاء، أرسل 0`;

      const message = WhatsAppMessage.create({
        sellerId: order.sellerId,
        orderId: order.id,
        recipientPhone: customerPhone,
        messageType: 'text',
        messageContent: {
          notificationType: 'ORDER_PENDING_CONFIRMATION',
          text: textMessage,
        },
      });

      await this.whatsAppMessageRepository.create(message);

      const response = await this.whatsAppService.sendTextMessage(
        token.phoneNumberId, accessToken, customerPhone, textMessage
      );

      const whatsappMessageId = response.messages[0]?.id;
      if (whatsappMessageId) {
        await this.whatsAppMessageRepository.updateStatus(message.id, 'SENT', {
          whatsappMessageId, timestamp: new Date(),
        });
      }

      return { success: true, messageId: whatsappMessageId };
    } catch (error) {
      console.error('Send pending confirmation text error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send text message',
      };
    }
  }
}
