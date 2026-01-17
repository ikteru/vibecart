import { Order, OrderStatus } from '@/domain/entities/Order';
import { OrderRepository } from '@/domain/repositories/OrderRepository';

/**
 * MockOrderRepository
 *
 * In-memory implementation for testing.
 */
export class MockOrderRepository implements OrderRepository {
  private orders: Map<string, Order> = new Map();

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const orders = Array.from(this.orders.values());
    for (const order of orders) {
      if (order.orderNumber === orderNumber) {
        return order;
      }
    }
    return null;
  }

  async findByOrderNumberAndSeller(
    orderNumber: string,
    sellerId: string
  ): Promise<Order | null> {
    const orders = Array.from(this.orders.values());
    for (const order of orders) {
      if (order.orderNumber === orderNumber && order.sellerId === sellerId) {
        return order;
      }
    }
    return null;
  }

  async findLatestByBuyerAndSeller(
    buyerPhone: string,
    sellerId: string
  ): Promise<Order | null> {
    const normalizedPhone = buyerPhone.replace(/\D/g, '').slice(-9);
    let latestOrder: Order | null = null;

    const orders = Array.from(this.orders.values());
    for (const order of orders) {
      const orderPhone = order.customerPhone.toWhatsAppFormat().replace(/\D/g, '').slice(-9);
      if (
        orderPhone === normalizedPhone &&
        order.sellerId === sellerId
      ) {
        if (
          !latestOrder ||
          order.createdAt.getTime() > latestOrder.createdAt.getTime()
        ) {
          latestOrder = order;
        }
      }
    }

    return latestOrder;
  }

  async findBySellerId(
    sellerId: string,
    options?: {
      status?: OrderStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<Order[]> {
    let orders = Array.from(this.orders.values()).filter(
      (order) => order.sellerId === sellerId
    );

    if (options?.status) {
      orders = orders.filter((order) => order.status === options.status);
    }

    // Sort by createdAt descending
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = options?.offset || 0;
    const limit = options?.limit || 20;

    return orders.slice(offset, offset + limit);
  }

  async findByBuyerPhone(
    buyerPhone: string,
    options?: {
      sellerId?: string;
      limit?: number;
    }
  ): Promise<Order[]> {
    const normalizedPhone = buyerPhone.replace(/\D/g, '').slice(-9);

    let orders = Array.from(this.orders.values()).filter((order) => {
      const orderPhone = order.customerPhone.toWhatsAppFormat().replace(/\D/g, '').slice(-9);
      return orderPhone === normalizedPhone;
    });

    if (options?.sellerId) {
      orders = orders.filter((order) => order.sellerId === options.sellerId);
    }

    // Sort by createdAt descending
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      orders = orders.slice(0, options.limit);
    }

    return orders;
  }

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }

  async countBySellerId(sellerId: string, status?: OrderStatus): Promise<number> {
    let orders = Array.from(this.orders.values()).filter(
      (order) => order.sellerId === sellerId
    );

    if (status) {
      orders = orders.filter((order) => order.status === status);
    }

    return orders.length;
  }

  // Test helpers

  /**
   * Clear all orders (for test cleanup)
   */
  clear(): void {
    this.orders.clear();
  }

  /**
   * Add an order directly (for test setup)
   */
  addOrder(order: Order): void {
    this.orders.set(order.id, order);
  }

  /**
   * Get all orders (for test assertions)
   */
  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }
}
