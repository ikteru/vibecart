import { Product } from '@/domain/entities/Product';
import type { ProductResponseDTO } from '../dtos/ProductDTO';

/**
 * ProductMapper
 *
 * Converts between Product domain entity and DTOs.
 */
export const ProductMapper = {
  /**
   * Convert a Product entity to a response DTO
   */
  toDTO(product: Product): ProductResponseDTO {
    return {
      id: product.id,
      sellerId: product.sellerId,
      title: product.title,
      description: product.description,
      price: {
        amount: product.price.amount,
        currency: product.price.currency,
      },
      discountPrice: product.discountPrice
        ? {
            amount: product.discountPrice.amount,
            currency: product.discountPrice.currency,
          }
        : null,
      promotionLabel: product.promotionLabel,
      stock: product.stock,
      videoUrl: product.videoUrl,
      instagramMediaId: product.instagramMediaId,
      category: product.category.value,
      variants: product.variants,
      isActive: product.isActive,
      hasDiscount: product.hasDiscount(),
      discountPercentage: product.getDiscountPercentage(),
      effectivePrice: {
        amount: product.effectivePrice.amount,
        currency: product.effectivePrice.currency,
      },
      isInStock: product.isInStock(),
      hasLowStock: product.hasLowStock(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  },

  /**
   * Convert multiple Product entities to DTOs
   */
  toDTOList(products: Product[]): ProductResponseDTO[] {
    return products.map((product) => ProductMapper.toDTO(product));
  },
};
