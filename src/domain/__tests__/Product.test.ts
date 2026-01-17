import { describe, it, expect } from 'vitest';
import { Product, CreateProductInput } from '../entities/Product';
import { Money } from '../value-objects/Money';
import { ProductCategory } from '../value-objects/ProductCategory';
import { ProductFactory } from '@/test/factories';

describe('Product Entity', () => {
  describe('create()', () => {
    it('should create a product with valid input', () => {
      const input: CreateProductInput = {
        sellerId: 'seller-123',
        title: 'Handmade Moroccan Lamp',
        description: 'Beautiful handcrafted lamp',
        price: 250,
        stock: 15,
        videoUrl: 'https://example.com/video.mp4',
        category: 'home',
      };

      const product = Product.create(input);

      expect(product.id).toBeDefined();
      expect(product.sellerId).toBe('seller-123');
      expect(product.title).toBe('Handmade Moroccan Lamp');
      expect(product.description).toBe('Beautiful handcrafted lamp');
      expect(product.price.amount).toBe(250);
      expect(product.stock).toBe(15);
      expect(product.videoUrl).toBe('https://example.com/video.mp4');
      expect(product.category.value).toBe('home');
      expect(product.isActive).toBe(true);
    });

    it('should create a product with instagram media instead of video', () => {
      const product = ProductFactory.withInstagram('instagram-media-123');

      expect(product.instagramMediaId).toBe('instagram-media-123');
      expect(product.videoUrl).toBeNull();
    });

    it('should create a product with discount', () => {
      const product = ProductFactory.withDiscount(150, 'Summer Sale');

      expect(product.price.amount).toBe(200);
      expect(product.discountPrice?.amount).toBe(150);
      expect(product.promotionLabel).toBe('Summer Sale');
      expect(product.hasDiscount()).toBe(true);
    });

    it('should create a product with variants', () => {
      const product = ProductFactory.withVariants(['S', 'M', 'L', 'XL'], 'clothing');

      expect(product.variants).toEqual(['S', 'M', 'L', 'XL']);
      expect(product.hasVariants()).toBe(true);
    });

    it('should throw error for empty title', () => {
      expect(() => ProductFactory.create({ title: '' })).toThrow(
        'Product title is required'
      );
    });

    it('should throw error for whitespace-only title', () => {
      expect(() => ProductFactory.create({ title: '   ' })).toThrow(
        'Product title is required'
      );
    });

    it('should throw error for zero price', () => {
      expect(() => ProductFactory.create({ price: 0 })).toThrow(
        'Product price must be positive'
      );
    });

    it('should throw error for negative price', () => {
      expect(() => ProductFactory.create({ price: -50 })).toThrow(
        'Product price must be positive'
      );
    });

    it('should throw error for negative stock', () => {
      expect(() => ProductFactory.create({ stock: -1 })).toThrow(
        'Product stock cannot be negative'
      );
    });

    it('should throw error when neither video nor instagram media provided', () => {
      expect(() =>
        ProductFactory.create({ videoUrl: undefined, instagramMediaId: undefined })
      ).toThrow('Product must have either a video URL or Instagram media');
    });

    it('should trim title and description', () => {
      const product = ProductFactory.create({
        title: '  Test Product  ',
        description: '  A description  ',
      });

      expect(product.title).toBe('Test Product');
      expect(product.description).toBe('A description');
    });
  });

  describe('fromPersistence()', () => {
    it('should reconstitute a product from persistence data', () => {
      const now = new Date();
      const product = ProductFactory.fromPersistence({
        id: 'existing-product-id',
        sellerId: 'seller-456',
        title: 'Persisted Product',
        price: Money.create(300),
        stock: 20,
        isActive: false,
        createdAt: now,
        updatedAt: now,
      });

      expect(product.id).toBe('existing-product-id');
      expect(product.sellerId).toBe('seller-456');
      expect(product.title).toBe('Persisted Product');
      expect(product.price.amount).toBe(300);
      expect(product.stock).toBe(20);
      expect(product.isActive).toBe(false);
      expect(product.createdAt).toBe(now);
    });
  });

  describe('effectivePrice', () => {
    it('should return discount price when discount exists', () => {
      const product = ProductFactory.withDiscount(150);

      expect(product.effectivePrice.amount).toBe(150);
    });

    it('should return regular price when no discount', () => {
      const product = ProductFactory.create({ price: 200 });

      expect(product.effectivePrice.amount).toBe(200);
    });
  });

  describe('hasDiscount()', () => {
    it('should return true when discount price is less than regular price', () => {
      const product = ProductFactory.withDiscount(150);

      expect(product.hasDiscount()).toBe(true);
    });

    it('should return false when no discount price', () => {
      const product = ProductFactory.create();

      expect(product.hasDiscount()).toBe(false);
    });
  });

  describe('getDiscountPercentage()', () => {
    it('should calculate correct discount percentage', () => {
      const product = ProductFactory.withDiscount(100); // 200 -> 100 = 50%

      expect(product.getDiscountPercentage()).toBe(50);
    });

    it('should return 0 when no discount', () => {
      const product = ProductFactory.create();

      expect(product.getDiscountPercentage()).toBe(0);
    });
  });

  describe('isInStock()', () => {
    it('should return true when stock is positive', () => {
      const product = ProductFactory.create({ stock: 10 });

      expect(product.isInStock()).toBe(true);
    });

    it('should return false when stock is zero', () => {
      const product = ProductFactory.outOfStock();

      expect(product.isInStock()).toBe(false);
    });
  });

  describe('hasLowStock()', () => {
    it('should return true when stock is between 1 and 9', () => {
      const product = ProductFactory.withLowStock(5);

      expect(product.hasLowStock()).toBe(true);
    });

    it('should return false when stock is 10 or more', () => {
      const product = ProductFactory.create({ stock: 10 });

      expect(product.hasLowStock()).toBe(false);
    });

    it('should return false when out of stock', () => {
      const product = ProductFactory.outOfStock();

      expect(product.hasLowStock()).toBe(false);
    });
  });

  describe('hasVariants()', () => {
    it('should return true when variants exist', () => {
      const product = ProductFactory.withVariants(['S', 'M', 'L']);

      expect(product.hasVariants()).toBe(true);
    });

    it('should return false when no variants', () => {
      const product = ProductFactory.create({ variants: [] });

      expect(product.hasVariants()).toBe(false);
    });
  });

  describe('isValidVariant()', () => {
    it('should return true for valid variant', () => {
      const product = ProductFactory.withVariants(['S', 'M', 'L']);

      expect(product.isValidVariant('M')).toBe(true);
    });

    it('should return false for invalid variant', () => {
      const product = ProductFactory.withVariants(['S', 'M', 'L']);

      expect(product.isValidVariant('XXL')).toBe(false);
    });

    it('should return true for any value when no variants defined', () => {
      const product = ProductFactory.create({ variants: [] });

      expect(product.isValidVariant('anything')).toBe(true);
    });
  });

  describe('updateDetails()', () => {
    it('should update title', () => {
      const product = ProductFactory.create();
      product.updateDetails({ title: 'Updated Title' });

      expect(product.title).toBe('Updated Title');
    });

    it('should update description', () => {
      const product = ProductFactory.create();
      product.updateDetails({ description: 'Updated description' });

      expect(product.description).toBe('Updated description');
    });

    it('should update category', () => {
      const product = ProductFactory.create({ category: 'home' });
      product.updateDetails({ category: 'clothing' });

      expect(product.category.value).toBe('clothing');
    });

    it('should update variants', () => {
      const product = ProductFactory.create();
      product.updateDetails({ variants: ['Red', 'Blue', 'Green'] });

      expect(product.variants).toEqual(['Red', 'Blue', 'Green']);
    });

    it('should throw error for empty title', () => {
      const product = ProductFactory.create();

      expect(() => product.updateDetails({ title: '' })).toThrow(
        'Product title cannot be empty'
      );
    });

    it('should update updatedAt timestamp', () => {
      const product = ProductFactory.create();
      const originalUpdatedAt = product.updatedAt;

      // Small delay to ensure timestamp difference
      product.updateDetails({ title: 'New Title' });

      expect(product.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('updatePricing()', () => {
    it('should update price', () => {
      const product = ProductFactory.create({ price: 100 });
      product.updatePricing({ price: 150 });

      expect(product.price.amount).toBe(150);
    });

    it('should update discount price', () => {
      const product = ProductFactory.create({ price: 200 });
      product.updatePricing({ discountPrice: 150 });

      expect(product.discountPrice?.amount).toBe(150);
    });

    it('should remove discount price when set to null', () => {
      const product = ProductFactory.withDiscount(150);
      product.updatePricing({ discountPrice: null });

      expect(product.discountPrice).toBeNull();
    });

    it('should update promotion label', () => {
      const product = ProductFactory.create();
      product.updatePricing({ promotionLabel: 'Flash Sale' });

      expect(product.promotionLabel).toBe('Flash Sale');
    });

    it('should throw error for zero price', () => {
      const product = ProductFactory.create();

      expect(() => product.updatePricing({ price: 0 })).toThrow(
        'Product price must be positive'
      );
    });

    it('should throw error for negative price', () => {
      const product = ProductFactory.create();

      expect(() => product.updatePricing({ price: -50 })).toThrow(
        'Product price must be positive'
      );
    });
  });

  describe('updateStock()', () => {
    it('should update stock level', () => {
      const product = ProductFactory.create({ stock: 10 });
      product.updateStock(25);

      expect(product.stock).toBe(25);
    });

    it('should allow setting stock to zero', () => {
      const product = ProductFactory.create({ stock: 10 });
      product.updateStock(0);

      expect(product.stock).toBe(0);
    });

    it('should throw error for negative stock', () => {
      const product = ProductFactory.create();

      expect(() => product.updateStock(-1)).toThrow('Stock cannot be negative');
    });
  });

  describe('decreaseStock()', () => {
    it('should decrease stock by amount', () => {
      const product = ProductFactory.create({ stock: 10 });
      product.decreaseStock(3);

      expect(product.stock).toBe(7);
    });

    it('should allow decreasing to zero', () => {
      const product = ProductFactory.create({ stock: 5 });
      product.decreaseStock(5);

      expect(product.stock).toBe(0);
    });

    it('should throw error for insufficient stock', () => {
      const product = ProductFactory.create({ stock: 5 });

      expect(() => product.decreaseStock(10)).toThrow(
        'Insufficient stock. Available: 5, Requested: 10'
      );
    });

    it('should throw error for zero amount', () => {
      const product = ProductFactory.create({ stock: 10 });

      expect(() => product.decreaseStock(0)).toThrow(
        'Decrease amount must be positive'
      );
    });

    it('should throw error for negative amount', () => {
      const product = ProductFactory.create({ stock: 10 });

      expect(() => product.decreaseStock(-5)).toThrow(
        'Decrease amount must be positive'
      );
    });
  });

  describe('increaseStock()', () => {
    it('should increase stock by amount', () => {
      const product = ProductFactory.create({ stock: 10 });
      product.increaseStock(5);

      expect(product.stock).toBe(15);
    });

    it('should throw error for zero amount', () => {
      const product = ProductFactory.create({ stock: 10 });

      expect(() => product.increaseStock(0)).toThrow(
        'Increase amount must be positive'
      );
    });

    it('should throw error for negative amount', () => {
      const product = ProductFactory.create({ stock: 10 });

      expect(() => product.increaseStock(-5)).toThrow(
        'Increase amount must be positive'
      );
    });
  });

  describe('activate() / deactivate()', () => {
    it('should activate product', () => {
      const product = ProductFactory.inactive();
      product.activate();

      expect(product.isActive).toBe(true);
    });

    it('should deactivate product', () => {
      const product = ProductFactory.create();
      product.deactivate();

      expect(product.isActive).toBe(false);
    });
  });

  describe('applyDiscount()', () => {
    it('should apply discount with label', () => {
      const product = ProductFactory.create({ price: 200 });
      product.applyDiscount(150, 'Black Friday');

      expect(product.discountPrice?.amount).toBe(150);
      expect(product.promotionLabel).toBe('Black Friday');
      expect(product.hasDiscount()).toBe(true);
    });

    it('should apply discount without label', () => {
      const product = ProductFactory.create({ price: 200 });
      product.applyDiscount(150);

      expect(product.discountPrice?.amount).toBe(150);
      expect(product.promotionLabel).toBeNull();
    });

    it('should throw error for zero discount price', () => {
      const product = ProductFactory.create({ price: 200 });

      expect(() => product.applyDiscount(0)).toThrow(
        'Discount price must be positive'
      );
    });

    it('should throw error when discount >= regular price', () => {
      const product = ProductFactory.create({ price: 200 });

      expect(() => product.applyDiscount(200)).toThrow(
        'Discount price must be less than regular price'
      );
    });
  });

  describe('removeDiscount()', () => {
    it('should remove discount and promotion label', () => {
      const product = ProductFactory.withDiscount(150, 'Sale');
      product.removeDiscount();

      expect(product.discountPrice).toBeNull();
      expect(product.promotionLabel).toBeNull();
      expect(product.hasDiscount()).toBe(false);
    });
  });

  describe('toPersistence()', () => {
    it('should serialize all properties', () => {
      const product = ProductFactory.create({
        title: 'Persistence Test',
        price: 300,
        discountPrice: 250,
        promotionLabel: 'Test Sale',
        stock: 50,
        variants: ['A', 'B'],
      });

      const persisted = product.toPersistence();

      expect(persisted.id).toBe(product.id);
      expect(persisted.sellerId).toBe(product.sellerId);
      expect(persisted.title).toBe('Persistence Test');
      expect(persisted.price.amount).toBe(300);
      expect(persisted.discountPrice?.amount).toBe(250);
      expect(persisted.promotionLabel).toBe('Test Sale');
      expect(persisted.stock).toBe(50);
      expect(persisted.variants).toEqual(['A', 'B']);
      expect(persisted.isActive).toBe(true);
      expect(persisted.createdAt).toBeDefined();
      expect(persisted.updatedAt).toBeDefined();
    });

    it('should not include undefined optional fields', () => {
      const product = ProductFactory.create();

      const persisted = product.toPersistence();

      expect(persisted.discountPrice).toBeUndefined();
      expect(persisted.promotionLabel).toBeUndefined();
      expect(persisted.instagramMediaId).toBeUndefined();
    });
  });
});
