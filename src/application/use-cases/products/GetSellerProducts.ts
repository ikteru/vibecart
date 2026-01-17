import { ProductRepository } from '@/domain/repositories/ProductRepository';
import { ProductMapper } from '@/application/mappers/ProductMapper';
import type {
  ProductListQueryDTO,
  ProductListResponseDTO,
} from '@/application/dtos/ProductDTO';

/**
 * GetSellerProducts Use Case
 *
 * Retrieves products for a seller with filtering and pagination.
 */
export class GetSellerProducts {
  constructor(private productRepository: ProductRepository) {}

  async execute(input: ProductListQueryDTO): Promise<ProductListResponseDTO> {
    const { sellerId, category, isActive, search, limit = 20, offset = 0 } = input;

    let products;

    if (search) {
      products = await this.productRepository.search(search, {
        sellerId,
        category,
        isActive,
        limit,
        offset,
      });
    } else {
      products = await this.productRepository.findBySellerId(sellerId, {
        category,
        isActive,
        limit,
        offset,
      });
    }

    const total = await this.productRepository.countBySellerId(sellerId, {
      category,
      isActive,
    });

    return {
      products: ProductMapper.toDTOList(products),
      total,
      limit,
      offset,
      hasMore: offset + products.length < total,
    };
  }
}
