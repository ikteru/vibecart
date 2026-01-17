import { ProductRepository } from '@/domain/repositories/ProductRepository';

/**
 * DeleteProduct Use Case Input
 */
export interface DeleteProductInput {
  productId: string;
  sellerId: string; // For authorization
  hardDelete?: boolean; // If true, permanently delete; otherwise, just deactivate
}

/**
 * DeleteProduct Use Case Output
 */
export interface DeleteProductOutput {
  success: boolean;
  error?: string;
}

/**
 * DeleteProduct Use Case
 *
 * Deletes or deactivates a product.
 */
export class DeleteProduct {
  constructor(private productRepository: ProductRepository) {}

  async execute(input: DeleteProductInput): Promise<DeleteProductOutput> {
    try {
      const { productId, sellerId, hardDelete = false } = input;

      // Find the product
      const product = await this.productRepository.findById(productId);

      if (!product) {
        return {
          success: false,
          error: 'Product not found',
        };
      }

      // Authorization check
      if (product.sellerId !== sellerId) {
        return {
          success: false,
          error: 'Not authorized to delete this product',
        };
      }

      if (hardDelete) {
        // Permanently delete from database
        await this.productRepository.delete(productId);
      } else {
        // Soft delete - just deactivate
        product.deactivate();
        await this.productRepository.save(product);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete product',
      };
    }
  }
}
