import { ProductRepository } from '@/domain/repositories/ProductRepository';
import { ProductMapper } from '@/application/mappers/ProductMapper';
import type { UpdateProductDTO, ProductResponseDTO } from '@/application/dtos/ProductDTO';

/**
 * UpdateProduct Use Case Input
 */
export interface UpdateProductInput {
  productId: string;
  sellerId: string; // For authorization
  updates: UpdateProductDTO;
}

/**
 * UpdateProduct Use Case Output
 */
export interface UpdateProductOutput {
  success: boolean;
  product?: ProductResponseDTO;
  error?: string;
}

/**
 * UpdateProduct Use Case
 *
 * Updates an existing product.
 */
export class UpdateProduct {
  constructor(private productRepository: ProductRepository) {}

  async execute(input: UpdateProductInput): Promise<UpdateProductOutput> {
    try {
      const { productId, sellerId, updates } = input;

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
          error: 'Not authorized to update this product',
        };
      }

      // Apply updates
      if (
        updates.title !== undefined ||
        updates.description !== undefined ||
        updates.videoUrl !== undefined ||
        updates.instagramMediaId !== undefined ||
        updates.category !== undefined ||
        updates.variants !== undefined
      ) {
        product.updateDetails({
          title: updates.title,
          description: updates.description,
          videoUrl: updates.videoUrl,
          instagramMediaId: updates.instagramMediaId,
          category: updates.category,
          variants: updates.variants,
        });
      }

      if (
        updates.price !== undefined ||
        updates.discountPrice !== undefined ||
        updates.promotionLabel !== undefined
      ) {
        product.updatePricing({
          price: updates.price,
          discountPrice: updates.discountPrice,
          promotionLabel: updates.promotionLabel,
        });
      }

      if (updates.stock !== undefined) {
        product.updateStock(updates.stock);
      }

      if (updates.isActive !== undefined) {
        if (updates.isActive) {
          product.activate();
        } else {
          product.deactivate();
        }
      }

      // Save changes
      await this.productRepository.save(product);

      return {
        success: true,
        product: ProductMapper.toDTO(product),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product',
      };
    }
  }
}
