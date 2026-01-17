import { ProductRepository } from '@/domain/repositories/ProductRepository';
import { ProductMapper } from '@/application/mappers/ProductMapper';
import type { ProductResponseDTO } from '@/application/dtos/ProductDTO';

/**
 * GetProduct Use Case Input
 */
export interface GetProductInput {
  productId: string;
}

/**
 * GetProduct Use Case Output
 */
export interface GetProductOutput {
  product: ProductResponseDTO | null;
}

/**
 * GetProduct Use Case
 *
 * Retrieves a single product by ID.
 */
export class GetProduct {
  constructor(private productRepository: ProductRepository) {}

  async execute(input: GetProductInput): Promise<GetProductOutput> {
    const product = await this.productRepository.findById(input.productId);

    if (!product) {
      return { product: null };
    }

    return {
      product: ProductMapper.toDTO(product),
    };
  }
}
