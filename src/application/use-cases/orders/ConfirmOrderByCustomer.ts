/**
 * ConfirmOrderByCustomer Use Case
 *
 * Automatically confirms an order when a customer replies to the WhatsApp confirmation request.
 * Used by the WhatsApp webhook when processing customer confirmations.
 */

import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { OrderMapper } from '@/application/mappers/OrderMapper';
import type { OrderResponseDTO } from '@/application/dtos/OrderDTO';
import type { WhatsAppTokenRepository } from '@/domain/repositories/WhatsAppTokenRepository';
import type { WhatsAppMessageRepository } from '@/domain/repositories/WhatsAppMessageRepository';
import { SendOrderNotification } from '@/application/use-cases/whatsapp-business';

export interface ConfirmOrderByCustomerInput {
  sellerId: string;
  customerPhone: string;
  orderNumber?: string; // Optional - if not provided, confirm latest pending
}

export interface ConfirmOrderByCustomerOutput {
  success: boolean;
  order?: OrderResponseDTO;
  error?: string;
  notificationSent?: boolean;
}

export class ConfirmOrderByCustomer {
  constructor(
    private orderRepository: OrderRepository,
    private whatsAppTokenRepository: WhatsAppTokenRepository,
    private whatsAppMessageRepository: WhatsAppMessageRepository
  ) {}

  async execute(input: ConfirmOrderByCustomerInput): Promise<ConfirmOrderByCustomerOutput> {
    try {
      // Normalize phone number - extract last 9 digits for matching
      const normalizedPhone = input.customerPhone.replace(/\D/g, '');
      const phoneDigits = normalizedPhone.slice(-9);

      let order;

      if (input.orderNumber) {
        // Find specific order by order number
        order = await this.orderRepository.findByOrderNumberAndSeller(
          input.orderNumber,
          input.sellerId
        );

        if (!order) {
          return {
            success: false,
            error: `Order ${input.orderNumber} not found`,
          };
        }

        // Verify the phone number matches
        const orderPhoneDigits = order.customerPhone.toWhatsAppFormat().slice(-9);
        if (orderPhoneDigits !== phoneDigits) {
          return {
            success: false,
            error: 'Phone number does not match order',
          };
        }
      } else {
        // Find the latest pending order for this customer and seller
        order = await this.orderRepository.findLatestByBuyerAndSeller(
          input.customerPhone,
          input.sellerId
        );

        if (!order) {
          return {
            success: false,
            error: 'No pending orders found for this phone number',
          };
        }
      }

      // Check if order is already confirmed or in a final state
      if (!order.isPending()) {
        if (order.isConfirmed() || order.isShipped() || order.isDelivered()) {
          return {
            success: false,
            error: `Order ${order.orderNumber} is already confirmed`,
          };
        }
        if (order.isCancelled()) {
          return {
            success: false,
            error: `Order ${order.orderNumber} has been cancelled`,
          };
        }
      }

      // Confirm the order
      order.confirm();
      await this.orderRepository.save(order);

      // Send ORDER_CONFIRMED notification
      let notificationSent = false;
      try {
        const sendNotification = new SendOrderNotification(
          this.whatsAppTokenRepository,
          this.whatsAppMessageRepository,
          this.orderRepository
        );

        const notificationResult = await sendNotification.execute({
          orderId: order.id,
          notificationType: 'ORDER_CONFIRMED',
        });

        notificationSent = notificationResult.success;
        if (!notificationResult.success) {
          console.warn(
            `WhatsApp confirmation notification failed for order ${order.orderNumber}:`,
            notificationResult.error
          );
        }
      } catch (error) {
        console.error('WhatsApp confirmation notification error:', error);
      }

      return {
        success: true,
        order: OrderMapper.toDTO(order),
        notificationSent,
      };
    } catch (error) {
      console.error('ConfirmOrderByCustomer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm order',
      };
    }
  }
}
