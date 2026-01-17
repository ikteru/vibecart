import { describe, it, expect, beforeEach } from 'vitest';
import { GetSellerProducts } from '../use-cases/products/GetSellerProducts';
import { MockProductRepository } from '@/test/mocks/MockProductRepository';
import { ProductFactory } from '@/test/factories';

describe('GetSellerProducts Use Case', () => {
  let productRepository: MockProductRepository;
  let useCase: GetSellerProducts;

  beforeEach(() => {
    productRepository = new MockProductRepository();
    useCase = new GetSellerProducts(productRepository);
  });

  describe('execute()', () => {
    it('should return products for a seller', async () => {
      const sellerId = 'seller-123';
      const products = [
        ProductFactory.create({ sellerId, title: 'Product 1' }),
        ProductFactory.create({ sellerId, title: 'Product 2' }),
      ];
      productRepository.seedWith(products);

      const result = await useCase.execute({ sellerId });

      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('should return empty list for seller with no products', async () => {
      const result = await useCase.execute({ sellerId: 'no-products-seller' });

      expect(result.products).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by category', async () => {
      const sellerId = 'seller-123';
      const products = [
        ProductFactory.create({ sellerId, category: 'clothing' }),
        ProductFactory.create({ sellerId, category: 'home' }),
        ProductFactory.create({ sellerId, category: 'clothing' }),
      ];
      productRepository.seedWith(products);

      const result = await useCase.execute({ sellerId, category: 'clothing' });

      expect(result.products).toHaveLength(2);
      expect(result.products.every((p) => p.category === 'clothing')).toBe(true);
    });

    it('should filter by active status', async () => {
      const sellerId = 'seller-123';
      const activeProduct = ProductFactory.create({ sellerId });
      const inactiveProduct = ProductFactory.fromPersistence({
        sellerId,
        isActive: false,
      });
      productRepository.seedWith([activeProduct, inactiveProduct]);

      const result = await useCase.execute({ sellerId, isActive: true });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].isActive).toBe(true);
    });

    it('should apply pagination with limit and offset', async () => {
      const sellerId = 'seller-123';
      const products = Array.from({ length: 10 }, (_, i) =>
        ProductFactory.create({ sellerId, title: `Product ${i + 1}` })
      );
      productRepository.seedWith(products);

      const result = await useCase.execute({
        sellerId,
        limit: 3,
        offset: 2,
      });

      expect(result.products).toHaveLength(3);
      expect(result.limit).toBe(3);
      expect(result.offset).toBe(2);
      expect(result.total).toBe(10);
      expect(result.hasMore).toBe(true);
    });

    it('should set hasMore to false when on last page', async () => {
      const sellerId = 'seller-123';
      const products = Array.from({ length: 5 }, (_, i) =>
        ProductFactory.create({ sellerId, title: `Product ${i + 1}` })
      );
      productRepository.seedWith(products);

      const result = await useCase.execute({
        sellerId,
        limit: 3,
        offset: 3,
      });

      expect(result.products).toHaveLength(2);
      expect(result.hasMore).toBe(false);
    });

    it('should search products by title', async () => {
      const sellerId = 'seller-123';
      const products = [
        ProductFactory.create({ sellerId, title: 'Moroccan Lamp' }),
        ProductFactory.create({ sellerId, title: 'Leather Bag' }),
        ProductFactory.create({ sellerId, title: 'Brass Lamp Stand' }),
      ];
      productRepository.seedWith(products);

      const result = await useCase.execute({ sellerId, search: 'lamp' });

      expect(result.products).toHaveLength(2);
      expect(result.products.every((p) => p.title.toLowerCase().includes('lamp'))).toBe(
        true
      );
    });

    it('should return DTOs with computed properties', async () => {
      const sellerId = 'seller-123';
      const product = ProductFactory.create({
        sellerId,
        price: 200,
        discountPrice: 150,
        stock: 5,
      });
      productRepository.seedWith([product]);

      const result = await useCase.execute({ sellerId });

      expect(result.products[0].hasDiscount).toBe(true);
      expect(result.products[0].discountPercentage).toBe(25);
      expect(result.products[0].effectivePrice.amount).toBe(150);
      expect(result.products[0].hasLowStock).toBe(true);
      expect(result.products[0].isInStock).toBe(true);
    });
  });
});
