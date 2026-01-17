import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { OrderMapper } from '@/application/mappers/OrderMapper';
import type { OrderResponseDTO } from '@/application/dtos/OrderDTO';

/**
 * GetOrder Use Case Input
 */
export interface GetOrderInput {
  orderId?: string;
  orderNumber?: string;
  sellerId?: string;
}

/**
 * GetOrder Use Case Output
 */
export interface GetOrderOutput {
  success: boolean;
  order?: OrderResponseDTO;
  error?: string;
}

/**
 * GetOrder Use Case
 *
 * Retrieves a single order by ID or order number.
 */
export class GetOrder {
  constructor(private orderRepository: OrderRepository) {}

  async execute(input: GetOrderInput): Promise<GetOrderOutput> {
    try {
      let order = null;

      if (input.orderId) {
        order = await this.orderRepository.findById(input.orderId);
      } else if (input.orderNumber && input.sellerId) {
        order = await this.orderRepository.findByOrderNumberAndSeller(
          input.orderNumber,
          input.sellerId
        );
      } else if (input.orderNumber) {
        order = await this.orderRepository.findByOrderNumber(input.orderNumber);
      }

      if (!order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      return {
        success: true,
        order: OrderMapper.toDTO(order),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get order',
      };
    }
  }
}
