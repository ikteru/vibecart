import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { OrderMapper } from '@/application/mappers/OrderMapper';
import type { AddOrderMessageDTO, ChatMessageDTO } from '@/application/dtos/OrderDTO';

/**
 * AddOrderMessage Use Case Output
 */
export interface AddOrderMessageOutput {
  success: boolean;
  message?: ChatMessageDTO;
  error?: string;
}

/**
 * AddOrderMessage Use Case
 *
 * Adds a chat message to an order.
 */
export class AddOrderMessage {
  constructor(private orderRepository: OrderRepository) {}

  async execute(input: AddOrderMessageDTO): Promise<AddOrderMessageOutput> {
    try {
      const order = await this.orderRepository.findById(input.orderId);

      if (!order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      // Add message based on sender
      let message;
      if (input.sender === 'seller') {
        message = order.addSellerMessage(input.content);
      } else {
        message = order.addBuyerMessage(input.content);
      }

      // Save updated order
      await this.orderRepository.save(order);

      return {
        success: true,
        message: OrderMapper.messageToDTO(message),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add message',
      };
    }
  }
}
