import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { OrderMapper } from '@/application/mappers/OrderMapper';
import type { UpdateOrderStatusDTO, OrderResponseDTO } from '@/application/dtos/OrderDTO';
import type { WhatsAppTokenRepository } from '@/domain/repositories/WhatsAppTokenRepository';
import type { WhatsAppMessageRepository } from '@/domain/repositories/WhatsAppMessageRepository';
import { SendOrderNotification, NotificationType } from '@/application/use-cases/whatsapp-business';

/**
 * UpdateOrderStatus Use Case Output
 */
export interface UpdateOrderStatusOutput {
  success: boolean;
  order?: OrderResponseDTO;
  error?: string;
  notificationSent?: boolean;
  notificationError?: string;
}

/**
 * UpdateOrderStatus Use Case
 *
 * Updates order status (confirm, ship, deliver, cancel).
 * Optionally sends WhatsApp notification to customer if seller has connected WhatsApp Business.
 */
export class UpdateOrderStatus {
  private orderRepository: OrderRepository;
  private whatsAppTokenRepository?: WhatsAppTokenRepository;
  private whatsAppMessageRepository?: WhatsAppMessageRepository;

  constructor(
    orderRepository: OrderRepository,
    whatsAppTokenRepository?: WhatsAppTokenRepository,
    whatsAppMessageRepository?: WhatsAppMessageRepository
  ) {
    this.orderRepository = orderRepository;
    this.whatsAppTokenRepository = whatsAppTokenRepository;
    this.whatsAppMessageRepository = whatsAppMessageRepository;
  }

  async execute(input: UpdateOrderStatusDTO): Promise<UpdateOrderStatusOutput> {
    try {
      const order = await this.orderRepository.findById(input.orderId);

      if (!order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      // Apply status transition
      let notificationType: NotificationType | null = null;

      switch (input.action) {
        case 'confirm':
          order.confirm();
          notificationType = 'ORDER_CONFIRMED';
          break;
        case 'ship':
          order.ship(input.trackingNumber);
          notificationType = 'ORDER_SHIPPED';
          break;
        case 'deliver':
          order.deliver();
          notificationType = 'ORDER_DELIVERED';
          break;
        case 'cancel':
          order.cancel(input.cancelReason);
          notificationType = 'ORDER_CANCELLED';
          break;
        default:
          return {
            success: false,
            error: `Unknown action: ${input.action}`,
          };
      }

      // Save updated order
      await this.orderRepository.save(order);

      // Send WhatsApp notification (non-blocking)
      let notificationSent = false;
      let notificationError: string | undefined;

      if (
        notificationType &&
        this.whatsAppTokenRepository &&
        this.whatsAppMessageRepository &&
        input.sendNotification !== false // Allow explicit opt-out
      ) {
        try {
          const sendNotification = new SendOrderNotification(
            this.whatsAppTokenRepository,
            this.whatsAppMessageRepository,
            this.orderRepository
          );

          const notificationResult = await sendNotification.execute({
            orderId: order.id,
            notificationType,
          });

          notificationSent = notificationResult.success;
          if (!notificationResult.success) {
            notificationError = notificationResult.error;
            console.warn(
              `WhatsApp notification failed for order ${order.orderNumber}:`,
              notificationResult.error
            );
          }
        } catch (error) {
          // Don't fail the order update if notification fails
          notificationError = error instanceof Error ? error.message : 'Notification failed';
          console.error('WhatsApp notification error:', error);
        }
      }

      return {
        success: true,
        order: OrderMapper.toDTO(order),
        notificationSent,
        notificationError,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update order status',
      };
    }
  }
}
