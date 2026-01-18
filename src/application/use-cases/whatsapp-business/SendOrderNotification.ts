/**
 * Send Order Notification Use Case
 *
 * Sends WhatsApp template messages for order status updates.
 */

import { WhatsAppCloudApiService, TemplateComponent } from '@/infrastructure/external-services/WhatsAppCloudApiService';
import { WhatsAppMessage } from '@/domain/entities/WhatsAppMessage';
import { decryptWhatsAppToken } from '@/infrastructure/utils/encryption';
import type { WhatsAppTokenRepository } from '@/domain/repositories/WhatsAppTokenRepository';
import type { WhatsAppMessageRepository } from '@/domain/repositories/WhatsAppMessageRepository';
import type { OrderRepository } from '@/domain/repositories/OrderRepository';

export type NotificationType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED';

interface SendOrderNotificationInput {
  orderId: string;
  notificationType: NotificationType;
}

interface SendOrderNotificationOutput {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Template names matching what's registered in Meta Business Manager
const TEMPLATE_NAMES: Record<NotificationType, string> = {
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

  constructor(
    whatsAppTokenRepository: WhatsAppTokenRepository,
    whatsAppMessageRepository: WhatsAppMessageRepository,
    orderRepository: OrderRepository
  ) {
    this.whatsAppService = new WhatsAppCloudApiService();
    this.whatsAppTokenRepository = whatsAppTokenRepository;
    this.whatsAppMessageRepository = whatsAppMessageRepository;
    this.orderRepository = orderRepository;
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

      // 5. Get template name and build components
      const templateName = TEMPLATE_NAMES[input.notificationType];
      const components = this.buildTemplateComponents(input.notificationType, order);

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
        'ar', // Arabic language code
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

  private buildTemplateComponents(
    notificationType: NotificationType,
    order: { orderNumber: string; customerName: string; trackingNumber?: string | null }
  ): TemplateComponent[] {
    const components: TemplateComponent[] = [];

    switch (notificationType) {
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
}
