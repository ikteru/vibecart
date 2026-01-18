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
  validationErrors?: string[];
}

/**
 * Validation result
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * CreateOrder Use Case
 *
 * Creates a new order from checkout.
 * Includes input validation and transactional stock management.
 */
export class CreateOrder {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository?: ProductRepository
  ) {}

  /**
   * Validate input data before processing
   */
  private validateInput(input: Partial<CreateOrderDTO>): ValidationResult {
    const errors: string[] = [];

    // Required fields validation
    if (!input.sellerId?.trim()) {
      errors.push('Seller ID is required');
    }

    if (!input.customerName?.trim()) {
      errors.push('Customer name is required');
    }

    if (!input.customerPhone?.trim()) {
      errors.push('Customer phone is required');
    }

    // Shipping address validation
    if (!input.shippingAddress) {
      errors.push('Shipping address is required');
    } else {
      if (!input.shippingAddress.city?.trim()) {
        errors.push('City is required in shipping address');
      }
      if (!input.shippingAddress.street?.trim()) {
        errors.push('Street is required in shipping address');
      }
    }

    // Items validation
    if (!input.items || input.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      input.items.forEach((item, index) => {
        if (!item.title?.trim()) {
          errors.push(`Item ${index + 1}: title is required`);
        }
        if (typeof item.price !== 'number' || item.price <= 0) {
          errors.push(`Item ${index + 1}: price must be a positive number`);
        }
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: quantity must be a positive number`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async execute(input: CreateOrderDTO): Promise<CreateOrderOutput> {
    // Validate input first
    const validation = this.validateInput(input);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors[0], // Primary error for backward compatibility
        validationErrors: validation.errors,
      };
    }

    try {
      // Create domain entity (additional domain validation happens here)
      const order = Order.create({
        sellerId: input.sellerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        shippingAddress: input.shippingAddress,
        items: input.items,
        shippingCost: input.shippingCost,
      });

      // Use transactional creation with stock validation and decrease
      // This ensures atomicity: if stock decrease fails, order is not created
      const shouldDecreaseStock = this.productRepository !== undefined;
      const createdOrder = await this.orderRepository.createWithItems(
        order,
        shouldDecreaseStock
      );

      return {
        success: true,
        order: OrderMapper.toDTO(createdOrder),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      };
    }
  }
}
