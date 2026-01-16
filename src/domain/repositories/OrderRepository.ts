import { Order, OrderStatus } from '../entities/Order';

/**
 * Order Repository Interface (Port)
 *
 * Defines the contract for order persistence operations.
 * Implementations will be in the infrastructure layer.
 */
export interface OrderRepository {
  /**
   * Find an order by its ID
   */
  findById(id: string): Promise<Order | null>;

  /**
   * Find an order by its order number
   */
  findByOrderNumber(orderNumber: string): Promise<Order | null>;

  /**
   * Find an order by order number and seller ID
   */
  findByOrderNumberAndSeller(orderNumber: string, sellerId: string): Promise<Order | null>;

  /**
   * Find the most recent order for a buyer from a specific seller
   */
  findLatestByBuyerAndSeller(buyerPhone: string, sellerId: string): Promise<Order | null>;

  /**
   * Find orders by seller ID
   */
  findBySellerId(sellerId: string, options?: {
    status?: OrderStatus;
    limit?: number;
    offset?: number;
  }): Promise<Order[]>;

  /**
   * Find orders by buyer phone
   */
  findByBuyerPhone(buyerPhone: string, options?: {
    sellerId?: string;
    limit?: number;
  }): Promise<Order[]>;

  /**
   * Save an order (create or update)
   */
  save(order: Order): Promise<void>;

  /**
   * Count orders by seller
   */
  countBySellerId(sellerId: string, status?: OrderStatus): Promise<number>;
}
