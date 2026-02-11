import { OrderDispatch, DispatchStatus } from '../entities/OrderDispatch';

/**
 * OrderDispatch Repository Interface (Port)
 *
 * Defines the contract for order dispatch persistence operations.
 * Implementations will be in the infrastructure layer.
 */
export interface OrderDispatchRepository {
  /**
   * Find a dispatch by ID
   */
  findById(id: string): Promise<OrderDispatch | null>;

  /**
   * Find a dispatch by ID and verify seller ownership
   */
  findByIdAndSeller(id: string, sellerId: string): Promise<OrderDispatch | null>;

  /**
   * Find all dispatches for an order
   */
  findByOrderId(orderId: string): Promise<OrderDispatch[]>;

  /**
   * Find the latest dispatch for an order
   */
  findLatestByOrderId(orderId: string): Promise<OrderDispatch | null>;

  /**
   * Find dispatches by seller
   */
  findBySellerId(
    sellerId: string,
    options?: {
      status?: DispatchStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<OrderDispatch[]>;

  /**
   * Find dispatches by delivery person
   */
  findByDeliveryPersonId(
    deliveryPersonId: string,
    options?: {
      status?: DispatchStatus;
      limit?: number;
    }
  ): Promise<OrderDispatch[]>;

  /**
   * Save a dispatch (create or update)
   */
  save(dispatch: OrderDispatch): Promise<void>;

  /**
   * Delete a dispatch
   */
  delete(id: string): Promise<void>;

  /**
   * Count dispatches for an order
   */
  countByOrderId(orderId: string): Promise<number>;

  /**
   * Check if an order has any active (non-completed) dispatch
   */
  hasActiveDispatch(orderId: string): Promise<boolean>;
}
