import { Product } from '@/domain/entities/Product';
import { ProductRepository } from '@/domain/repositories/ProductRepository';
import { ProductCategoryType } from '@/domain/value-objects/ProductCategory';

/**
 * MockProductRepository
 *
 * In-memory implementation of ProductRepository for testing.
 */
export class MockProductRepository implements ProductRepository {
  private products: Map<string, Product> = new Map();

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async findByInstagramMediaId(mediaId: string): Promise<Product | null> {
    const products = Array.from(this.products.values());
    for (const product of products) {
      if (product.instagramMediaId === mediaId) {
        return product;
      }
    }
    return null;
  }

  async findBySellerId(
    sellerId: string,
    options?: {
      category?: ProductCategoryType;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Product[]> {
    let results = Array.from(this.products.values()).filter(
      (p) => p.sellerId === sellerId
    );

    if (options?.category) {
      results = results.filter((p) => p.category.value === options.category);
    }

    if (options?.isActive !== undefined) {
      results = results.filter((p) => p.isActive === options.isActive);
    }

    // Sort by createdAt descending
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = options?.offset || 0;
    const limit = options?.limit || results.length;

    return results.slice(offset, offset + limit);
  }

  async search(
    query: string,
    options?: {
      sellerId?: string;
      category?: ProductCategoryType;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    let results = Array.from(this.products.values()).filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
    );

    if (options?.sellerId) {
      results = results.filter((p) => p.sellerId === options.sellerId);
    }

    if (options?.category) {
      results = results.filter((p) => p.category.value === options.category);
    }

    if (options?.isActive !== undefined) {
      results = results.filter((p) => p.isActive === options.isActive);
    }

    const offset = options?.offset || 0;
    const limit = options?.limit || results.length;

    return results.slice(offset, offset + limit);
  }

  async save(product: Product): Promise<void> {
    this.products.set(product.id, product);
  }

  async delete(id: string): Promise<void> {
    this.products.delete(id);
  }

  async countBySellerId(
    sellerId: string,
    options?: {
      category?: ProductCategoryType;
      isActive?: boolean;
    }
  ): Promise<number> {
    const products = await this.findBySellerId(sellerId, options);
    return products.length;
  }

  // Test helpers
  clear(): void {
    this.products.clear();
  }

  seedWith(products: Product[]): void {
    for (const product of products) {
      this.products.set(product.id, product);
    }
  }
}
