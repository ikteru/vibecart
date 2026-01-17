import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { OrderMapper } from '@/application/mappers/OrderMapper';
import type {
  OrderListQueryDTO,
  OrderListResponseDTO,
} from '@/application/dtos/OrderDTO';

/**
 * GetSellerOrders Use Case
 *
 * Retrieves orders for a seller with filtering and pagination.
 */
export class GetSellerOrders {
  constructor(private orderRepository: OrderRepository) {}

  async execute(input: OrderListQueryDTO): Promise<OrderListResponseDTO> {
    const { sellerId, status, limit = 20, offset = 0 } = input;

    const orders = await this.orderRepository.findBySellerId(sellerId, {
      status,
      limit,
      offset,
    });

    const total = await this.orderRepository.countBySellerId(sellerId, status);

    return {
      orders: OrderMapper.toSummaryDTOList(orders),
      total,
      limit,
      offset,
      hasMore: offset + orders.length < total,
    };
  }
}
