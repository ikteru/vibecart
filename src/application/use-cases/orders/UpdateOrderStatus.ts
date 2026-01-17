import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { OrderMapper } from '@/application/mappers/OrderMapper';
import type { UpdateOrderStatusDTO, OrderResponseDTO } from '@/application/dtos/OrderDTO';

/**
 * UpdateOrderStatus Use Case Output
 */
export interface UpdateOrderStatusOutput {
  success: boolean;
  order?: OrderResponseDTO;
  error?: string;
}

/**
 * UpdateOrderStatus Use Case
 *
 * Updates order status (confirm, ship, deliver, cancel).
 */
export class UpdateOrderStatus {
  constructor(private orderRepository: OrderRepository) {}

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
      switch (input.action) {
        case 'confirm':
          order.confirm();
          break;
        case 'ship':
          order.ship(input.trackingNumber);
          break;
        case 'deliver':
          order.deliver();
          break;
        case 'cancel':
          order.cancel(input.cancelReason);
          break;
        default:
          return {
            success: false,
            error: `Unknown action: ${input.action}`,
          };
      }

      // Save updated order
      await this.orderRepository.save(order);

      return {
        success: true,
        order: OrderMapper.toDTO(order),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update order status',
      };
    }
  }
}
