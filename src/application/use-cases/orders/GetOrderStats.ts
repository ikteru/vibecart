import type { OrderStatsDTO } from '@/application/dtos/OrderDTO';
import { SupabaseOrderRepository } from '@/infrastructure/persistence/supabase/SupabaseOrderRepository';

/**
 * GetOrderStats Use Case Input
 */
export interface GetOrderStatsInput {
  sellerId: string;
}

/**
 * GetOrderStats Use Case
 *
 * Retrieves order statistics for the seller dashboard.
 */
export class GetOrderStats {
  constructor(private orderRepository: SupabaseOrderRepository) {}

  async execute(input: GetOrderStatsInput): Promise<OrderStatsDTO> {
    const stats = await this.orderRepository.getStats(input.sellerId);

    return {
      totalOrders: stats.totalOrders,
      pendingOrders: stats.pendingOrders,
      totalRevenue: stats.totalRevenue, // In centimes
      currency: 'MAD',
      ordersToday: stats.ordersToday,
    };
  }
}
