import { Seller } from '../entities/Seller';

/**
 * Seller Repository Interface (Port)
 *
 * Defines the contract for seller persistence operations.
 * Implementations will be in the infrastructure layer.
 */
export interface SellerRepository {
  /**
   * Find a seller by ID
   */
  findById(id: string): Promise<Seller | null>;

  /**
   * Find a seller by handle (shop URL slug)
   */
  findByHandle(handle: string): Promise<Seller | null>;

  /**
   * Find a seller by user ID (auth user)
   */
  findByUserId(userId: string): Promise<Seller | null>;

  /**
   * Check if a handle is available
   */
  isHandleAvailable(handle: string, excludeSellerId?: string): Promise<boolean>;

  /**
   * Save a seller (create or update)
   */
  save(seller: Seller): Promise<void>;

  /**
   * Delete a seller by ID
   */
  delete(id: string): Promise<void>;
}
