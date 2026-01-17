/**
 * ProductFactory
 *
 * Test factory for creating Product instances with sensible defaults.
 */

import { Product, CreateProductInput, ProductProps } from '@/domain/entities/Product';
import { Money } from '@/domain/value-objects/Money';
import { ProductCategory, ProductCategoryType } from '@/domain/value-objects/ProductCategory';

type PartialProductInput = Partial<CreateProductInput>;
type PartialProductProps = Partial<ProductProps>;

export const ProductFactory = {
  /**
   * Create a new Product using the create() factory method
   */
  create(overrides: PartialProductInput = {}): Product {
    const defaults: CreateProductInput = {
      sellerId: 'test-seller-id',
      title: 'Test Product',
      description: 'A test product description',
      price: 100,
      stock: 10,
      videoUrl: 'https://example.com/video.mp4',
      category: 'home',
      variants: [],
    };

    return Product.create({
      ...defaults,
      ...overrides,
    });
  },

  /**
   * Create a Product from persistence (simulating database retrieval)
   */
  fromPersistence(overrides: PartialProductProps = {}): Product {
    const now = new Date();
    const defaults: ProductProps = {
      id: 'test-product-id',
      sellerId: 'test-seller-id',
      title: 'Test Product',
      description: 'A test product description',
      price: Money.create(100),
      stock: 10,
      videoUrl: 'https://example.com/video.mp4',
      category: ProductCategory.create('home'),
      variants: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    return Product.fromPersistence({
      ...defaults,
      ...overrides,
    });
  },

  /**
   * Create a Product with a discount
   */
  withDiscount(discountPrice: number, promotionLabel?: string): Product {
    return ProductFactory.create({
      price: 200,
      discountPrice,
      promotionLabel,
    });
  },

  /**
   * Create a Product with low stock
   */
  withLowStock(stock: number = 5): Product {
    return ProductFactory.create({ stock });
  },

  /**
   * Create a Product with variants
   */
  withVariants(variants: string[], category: ProductCategoryType = 'clothing'): Product {
    return ProductFactory.create({ variants, category });
  },

  /**
   * Create a Product linked to Instagram
   */
  withInstagram(instagramMediaId: string): Product {
    return ProductFactory.create({
      instagramMediaId,
      videoUrl: undefined,
    });
  },

  /**
   * Create an inactive Product
   */
  inactive(): Product {
    const product = ProductFactory.fromPersistence({ isActive: false });
    return product;
  },

  /**
   * Create a Product with out of stock
   */
  outOfStock(): Product {
    return ProductFactory.create({ stock: 0 });
  },
};
