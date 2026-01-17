/**
 * SearchOrders Use Case
 *
 * Searches orders for a seller with full-text search and filters.
 */

import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { OrderMapper } from '@/application/mappers/OrderMapper';
import type { OrderSummaryDTO } from '@/application/dtos/OrderDTO';
import type { OrderStatus } from '@/domain/entities/Order';

export interface SearchOrdersInput {
  sellerId: string;
  searchQuery?: string;
  status?: OrderStatus;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface SearchOrdersOutput {
  success: boolean;
  orders: OrderSummaryDTO[];
  error?: string;
}

export class SearchOrders {
  constructor(private orderRepository: OrderRepository) {}

  async execute(input: SearchOrdersInput): Promise<SearchOrdersOutput> {
    try {
      const {
        sellerId,
        searchQuery,
        status,
        limit = 20,
        offset = 0,
      } = input;

      // If there's a search query, filter the orders
      // Otherwise, get all orders with optional status filter
      let orders = await this.orderRepository.findBySellerId(sellerId, {
        status,
        limit: searchQuery ? 100 : limit, // Get more if searching to filter
        offset: searchQuery ? 0 : offset,
      });

      // If there's a search query, filter locally
      // This works for small datasets; for larger datasets, use the DB function
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        orders = orders.filter((order) => {
          return (
            order.orderNumber.toLowerCase().includes(query) ||
            order.customerName.toLowerCase().includes(query) ||
            order.customerPhone.toDisplayFormat().includes(query)
          );
        });

        // Apply pagination after filtering
        orders = orders.slice(offset, offset + limit);
      }

      // Get unread counts
      const orderIds = orders.map((o) => o.id);
      const unreadCounts = await this.orderRepository.getUnreadCountsForOrders(orderIds);

      return {
        success: true,
        orders: OrderMapper.toSummaryDTOList(orders, unreadCounts),
      };
    } catch (error) {
      return {
        success: false,
        orders: [],
        error: error instanceof Error ? error.message : 'Failed to search orders',
      };
    }
  }
}
