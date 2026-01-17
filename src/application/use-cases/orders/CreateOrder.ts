import { Order } from '@/domain/entities/Order';
import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { ProductRepository } from '@/domain/repositories/ProductRepository';
import { OrderMapper } from '@/application/mappers/OrderMapper';
import type { CreateOrderDTO, OrderResponseDTO } from '@/application/dtos/OrderDTO';

/**
 * CreateOrder Use Case Output
 */
export interface CreateOrderOutput {
  success: boolean;
  order?: OrderResponseDTO;
  error?: string;
}

/**
 * CreateOrder Use Case
 *
 * Creates a new order from checkout.
 * Optionally validates stock availability.
 */
export class CreateOrder {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository?: ProductRepository
  ) {}

  async execute(input: CreateOrderDTO): Promise<CreateOrderOutput> {
    try {
      // Optionally validate stock for each item
      if (this.productRepository) {
        for (const item of input.items) {
          const product = await this.productRepository.findById(item.productId);
          if (product && product.stock < item.quantity) {
            return {
              success: false,
              error: `Insufficient stock for "${item.title}". Available: ${product.stock}, requested: ${item.quantity}`,
            };
          }
        }
      }

      // Create domain entity (validation happens here)
      const order = Order.create({
        sellerId: input.sellerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        shippingAddress: input.shippingAddress,
        items: input.items,
        shippingCost: input.shippingCost,
      });

      // Save to repository
      await this.orderRepository.save(order);

      // Optionally decrease stock
      if (this.productRepository) {
        for (const item of input.items) {
          const product = await this.productRepository.findById(item.productId);
          if (product) {
            product.decreaseStock(item.quantity);
            await this.productRepository.save(product);
          }
        }
      }

      return {
        success: true,
        order: OrderMapper.toDTO(order),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      };
    }
  }
}
