import { DeliveryPerson } from '../entities/DeliveryPerson';

/**
 * DeliveryPerson Repository Interface (Port)
 *
 * Defines the contract for delivery person persistence operations.
 * Implementations will be in the infrastructure layer.
 */
export interface DeliveryPersonRepository {
  /**
   * Find a delivery person by ID
   */
  findById(id: string): Promise<DeliveryPerson | null>;

  /**
   * Find a delivery person by ID and verify seller ownership
   */
  findByIdAndSeller(id: string, sellerId: string): Promise<DeliveryPerson | null>;

  /**
   * Find all delivery persons for a seller
   */
  findBySellerId(
    sellerId: string,
    options?: {
      activeOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<DeliveryPerson[]>;

  /**
   * Save a delivery person (create or update)
   */
  save(deliveryPerson: DeliveryPerson): Promise<void>;

  /**
   * Delete a delivery person
   */
  delete(id: string): Promise<void>;

  /**
   * Count delivery persons for a seller
   */
  countBySellerId(sellerId: string, activeOnly?: boolean): Promise<number>;

  /**
   * Check if a delivery person with the same phone exists for a seller
   */
  existsByPhoneAndSeller(phone: string, sellerId: string, excludeId?: string): Promise<boolean>;
}
