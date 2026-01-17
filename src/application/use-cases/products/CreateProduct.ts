import { Product } from '@/domain/entities/Product';
import { ProductRepository } from '@/domain/repositories/ProductRepository';
import { ProductMapper } from '@/application/mappers/ProductMapper';
import type { CreateProductDTO, ProductResponseDTO } from '@/application/dtos/ProductDTO';

/**
 * CreateProduct Use Case Output
 */
export interface CreateProductOutput {
  success: boolean;
  product?: ProductResponseDTO;
  error?: string;
}

/**
 * CreateProduct Use Case
 *
 * Creates a new product for a seller.
 */
export class CreateProduct {
  constructor(private productRepository: ProductRepository) {}

  async execute(input: CreateProductDTO): Promise<CreateProductOutput> {
    try {
      // Create domain entity (validation happens here)
      const product = Product.create({
        sellerId: input.sellerId,
        title: input.title,
        description: input.description,
        price: input.price,
        discountPrice: input.discountPrice,
        promotionLabel: input.promotionLabel,
        stock: input.stock,
        videoUrl: input.videoUrl,
        instagramMediaId: input.instagramMediaId,
        category: input.category,
        variants: input.variants,
      });

      // Save to repository
      await this.productRepository.save(product);

      return {
        success: true,
        product: ProductMapper.toDTO(product),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create product',
      };
    }
  }
}
