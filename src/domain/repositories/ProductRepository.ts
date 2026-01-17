import { Product } from '../entities/Product';
import { ProductCategoryType } from '../value-objects/ProductCategory';

/**
 * Product Repository Interface (Port)
 *
 * Defines the contract for product persistence operations.
 * Implementations will be in the infrastructure layer.
 */
export interface ProductRepository {
  /**
   * Find a product by its ID
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Find a product by Instagram media ID
   */
  findByInstagramMediaId(mediaId: string): Promise<Product | null>;

  /**
   * Find products by seller ID
   */
  findBySellerId(
    sellerId: string,
    options?: {
      category?: ProductCategoryType;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Product[]>;

  /**
   * Search products by title/description
   */
  search(
    query: string,
    options?: {
      sellerId?: string;
      category?: ProductCategoryType;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Product[]>;

  /**
   * Save a product (create or update)
   */
  save(product: Product): Promise<void>;

  /**
   * Delete a product by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Count products by seller
   */
  countBySellerId(
    sellerId: string,
    options?: {
      category?: ProductCategoryType;
      isActive?: boolean;
    }
  ): Promise<number>;
}
