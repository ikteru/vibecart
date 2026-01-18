/**
 * Send Order Notification Use Case
 *
 * Sends WhatsApp template messages for order status updates.
 * Uses seller-assigned custom templates when available,
 * falling back to system default templates otherwise.
 */

import { WhatsAppCloudApiService, TemplateComponent } from '@/infrastructure/external-services/WhatsAppCloudApiService';
import { WhatsAppMessage } from '@/domain/entities/WhatsAppMessage';
import { decryptWhatsAppToken } from '@/infrastructure/utils/encryption';
import type { WhatsAppTokenRepository } from '@/domain/repositories/WhatsAppTokenRepository';
import type { WhatsAppMessageRepository } from '@/domain/repositories/WhatsAppMessageRepository';
import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import type { TemplateEventBindingRepository } from '@/domain/repositories/TemplateEventBindingRepository';
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
  private whatsAppTokenRepository: WhatsAppTokenRepository;
  private whatsAppMessageRepository: WhatsAppMessageRepository;
  private orderRepository: OrderRepository;
  private templateEventBindingRepository?: TemplateEventBindingRepository;

  constructor(
    whatsAppTokenRepository: WhatsAppTokenRepository,
    whatsAppMessageRepository: WhatsAppMessageRepository,
    orderRepository: OrderRepository,
    templateEventBindingRepository?: TemplateEventBindingRepository
  ) {
    this.whatsAppService = new WhatsAppCloudApiService();
    this.whatsAppTokenRepository = whatsAppTokenRepository;
    this.whatsAppMessageRepository = whatsAppMessageRepository;
    this.orderRepository = orderRepository;
    this.templateEventBindingRepository = templateEventBindingRepository;
  }

  async execute(input: SendOrderNotificationInput): Promise<SendOrderNotificationOutput> {
    try {
      // 1. Get order details
      const order = await this.orderRepository.findById(input.orderId);
      if (!order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      // 2. Get seller's WhatsApp token
      const token = await this.whatsAppTokenRepository.findBySellerId(order.sellerId);
      if (!token || !token.isActive) {
        return {
          success: false,
          error: 'WhatsApp Business not connected for this seller',
        };
      }

      // Check if token is expired
      if (token.isExpired()) {
        return {
          success: false,
          error: 'WhatsApp token has expired. Please reconnect.',
        };
      }

      // 3. Decrypt access token
      const accessToken = decryptWhatsAppToken(token.accessTokenEncrypted);

      // 4. Get customer phone in WhatsApp format (212XXXXXXXXX)
      const customerPhone = order.customerPhone.toWhatsAppFormat();

      // 5. Get template - check for seller's custom template first, then fall back to system default
      let templateName: string;
      let languageCode: string;
      let components: TemplateComponent[];

      const customTemplate = await this.getSellerAssignedTemplate(
        order.sellerId,
        input.notificationType
      );

      if (customTemplate) {
        // Use seller's custom template
        templateName = customTemplate.templateName;
        languageCode = customTemplate.templateLanguage;
        components = this.buildCustomTemplateComponents(customTemplate.components, order);
      } else {
        // Fall back to system default template
        templateName = SYSTEM_TEMPLATE_NAMES[input.notificationType];
        languageCode = 'ar';
        components = this.buildDefaultTemplateComponents(input.notificationType, order);
      }

      // 6. Create message record before sending
      const message = WhatsAppMessage.create({
        sellerId: order.sellerId,
        orderId: order.id,
        recipientPhone: customerPhone,
        templateName,
        messageType: 'template',
        messageContent: {
          notificationType: input.notificationType,
          components,
        },
      });

      await this.whatsAppMessageRepository.create(message);

      // 7. Send the message
      const response = await this.whatsAppService.sendTemplateMessage(
        token.phoneNumberId,
        accessToken,
        customerPhone,
        templateName,
        languageCode,
        components
      );

      // 8. Update message with WhatsApp message ID
      const whatsappMessageId = response.messages[0]?.id;
      if (whatsappMessageId) {
        await this.whatsAppMessageRepository.updateStatus(message.id, 'SENT', {
          whatsappMessageId,
          timestamp: new Date(),
        });
      }

      return {
        success: true,
        messageId: whatsappMessageId,
      };
    } catch (error) {
      console.error('Send order notification error:', error);

      // Try to mark the message as failed if we have the message ID
      // This would require tracking the message ID before send attempt

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  /**
   * Get seller's assigned template for a notification event.
   * Returns null if no custom template is assigned or template is not approved.
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
   * Build template components from a custom template's component definition.
   * Maps order data to the template's variable placeholders.
   */
  private buildCustomTemplateComponents(
    templateComponents: unknown[],
    order: { orderNumber: string; customerName: string; trackingNumber?: string | null; total?: { amount: number; currency: string } }
  ): TemplateComponent[] {
    const components: TemplateComponent[] = [];

    // Build variable values map
    // Standard variable mapping: {{1}} = customer_name, {{2}} = order_number, etc.
    const variableValues: Record<string, string> = {
      '1': order.customerName,
      '2': order.orderNumber,
      '3': order.total ? `${order.total.amount} ${order.total.currency}` : '0 MAD',
      '4': order.trackingNumber || 'N/A',
      '5': '', // shop_name would need to be passed in
      '6': '1', // items_count would need to be calculated
    };

    for (const comp of templateComponents as Array<{ type: string; text?: string }>) {
      if (comp.type === 'BODY' && comp.text) {
        // Extract variables from the template text and build parameters
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
          components.push({
            type: 'body',
            parameters,
          });
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
        // Template: "مرحباً {{1}}! تم استلام طلبك رقم {{2}}. المجموع: {{3}} درهم. للتأكيد، أرسل 1. للإلغاء، أرسل 0"
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
        // Template: "مرحباً {{1}}! تم تأكيد طلبك رقم {{2}}. سنقوم بشحنه قريباً."
        components.push({
          type: 'body',
          parameters: [
            { type: 'text', text: order.customerName },
            { type: 'text', text: order.orderNumber },
          ],
        });
        break;

      case 'ORDER_SHIPPED':
        // Template: "طلبك رقم {{1}} في الطريق! رقم التتبع: {{2}}"
        components.push({
          type: 'body',
          parameters: [
            { type: 'text', text: order.orderNumber },
            { type: 'text', text: order.trackingNumber || 'غير متاح' },
          ],
        });
        break;

      case 'ORDER_DELIVERED':
        // Template: "تم توصيل طلبك رقم {{1}}. شكراً لتسوقك معنا!"
        components.push({
          type: 'body',
          parameters: [
            { type: 'text', text: order.orderNumber },
          ],
        });
        break;

      case 'ORDER_CANCELLED':
        // Template: "تم إلغاء طلبك رقم {{1}}. إذا كان لديك أي استفسار، راسلنا."
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

      // Build text message in Arabic
      const textMessage = `مرحباً ${order.customerName}!

تم استلام طلبك رقم ${order.orderNumber}
المجموع: ${order.total.amount} درهم

للتأكيد، أرسل 1
للإلغاء، أرسل 0`;

      // Create message record
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

      // Send text message
      const response = await this.whatsAppService.sendTextMessage(
        token.phoneNumberId,
        accessToken,
        customerPhone,
        textMessage
      );

      const whatsappMessageId = response.messages[0]?.id;
      if (whatsappMessageId) {
        await this.whatsAppMessageRepository.updateStatus(message.id, 'SENT', {
          whatsappMessageId,
          timestamp: new Date(),
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
