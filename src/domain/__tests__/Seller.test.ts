import { describe, it, expect } from 'vitest';
import { Seller, CreateSellerInput } from '../entities/Seller';
import { PhoneNumber } from '../value-objects/PhoneNumber';
import { SellerFactory } from '@/test/factories';

describe('Seller Entity', () => {
  describe('create()', () => {
    it('should create a seller with valid input', () => {
      const input: CreateSellerInput = {
        userId: 'user-123',
        shopName: 'Moroccan Treasures',
        handle: 'moroccan-treasures',
        whatsappNumber: '+212612345678',
      };

      const seller = Seller.create(input);

      expect(seller.id).toBeDefined();
      expect(seller.userId).toBe('user-123');
      expect(seller.shopName).toBe('Moroccan Treasures');
      expect(seller.handle).toBe('moroccan-treasures');
      expect(seller.whatsappNumber!.value).toBe('212612345678');
      expect(seller.shopConfig).toEqual({});
    });

    it('should create a seller with shop config', () => {
      const seller = SellerFactory.create({
        shopConfig: {
          heroText: 'Welcome!',
          accentColor: '#ff0000',
        },
      });

      expect(seller.shopConfig.heroText).toBe('Welcome!');
      expect(seller.shopConfig.accentColor).toBe('#ff0000');
    });

    it('should normalize handle to lowercase', () => {
      const seller = SellerFactory.create({ handle: 'MyShop' });

      expect(seller.handle).toBe('myshop');
    });

    it('should trim handle', () => {
      const seller = SellerFactory.create({ handle: '  myshop  ' });

      expect(seller.handle).toBe('myshop');
    });

    it('should trim shop name', () => {
      const seller = SellerFactory.create({ shopName: '  My Shop  ' });

      expect(seller.shopName).toBe('My Shop');
    });

    it('should throw error for empty shop name', () => {
      expect(() => SellerFactory.create({ shopName: '' })).toThrow(
        'Shop name is required'
      );
    });

    it('should throw error for whitespace-only shop name', () => {
      expect(() => SellerFactory.create({ shopName: '   ' })).toThrow(
        'Shop name is required'
      );
    });

    it('should throw error for empty handle', () => {
      expect(() => SellerFactory.create({ handle: '' })).toThrow(
        'Handle is required'
      );
    });

    it('should throw error for handle shorter than 3 characters', () => {
      expect(() => SellerFactory.create({ handle: 'ab' })).toThrow(
        'Handle must be 3-30 characters, alphanumeric with underscores/hyphens only'
      );
    });

    it('should throw error for handle longer than 30 characters', () => {
      const longHandle = 'a'.repeat(31);
      expect(() => SellerFactory.create({ handle: longHandle })).toThrow(
        'Handle must be 3-30 characters, alphanumeric with underscores/hyphens only'
      );
    });

    it('should throw error for handle with invalid characters', () => {
      expect(() => SellerFactory.create({ handle: 'my@shop' })).toThrow(
        'Handle must be 3-30 characters, alphanumeric with underscores/hyphens only'
      );
    });

    it('should allow handle with underscores and hyphens', () => {
      const seller = SellerFactory.create({ handle: 'my_shop-name' });

      expect(seller.handle).toBe('my_shop-name');
    });

    it('should throw error for invalid whatsapp number', () => {
      expect(() =>
        SellerFactory.create({ whatsappNumber: '12345' })
      ).toThrow('Invalid Moroccan phone number');
    });

    it('should accept various phone number formats', () => {
      const seller1 = SellerFactory.create({ whatsappNumber: '0612345678' });
      const seller2 = SellerFactory.create({ whatsappNumber: '+212612345678' });
      const seller3 = SellerFactory.create({ whatsappNumber: '212612345678' });

      expect(seller1.whatsappNumber!.value).toBe('212612345678');
      expect(seller2.whatsappNumber!.value).toBe('212612345678');
      expect(seller3.whatsappNumber!.value).toBe('212612345678');
    });
  });

  describe('fromPersistence()', () => {
    it('should reconstitute a seller from persistence data', () => {
      const now = new Date();
      const seller = SellerFactory.fromPersistence({
        id: 'existing-seller-id',
        userId: 'user-456',
        shopName: 'Persisted Shop',
        handle: 'persistedshop',
        createdAt: now,
        updatedAt: now,
      });

      expect(seller.id).toBe('existing-seller-id');
      expect(seller.userId).toBe('user-456');
      expect(seller.shopName).toBe('Persisted Shop');
      expect(seller.handle).toBe('persistedshop');
      expect(seller.createdAt).toBe(now);
    });
  });

  describe('validateHandle()', () => {
    it('should return true for valid handles', () => {
      expect(Seller.validateHandle('myshop')).toBe(true);
      expect(Seller.validateHandle('my-shop')).toBe(true);
      expect(Seller.validateHandle('my_shop')).toBe(true);
      expect(Seller.validateHandle('myshop123')).toBe(true);
      expect(Seller.validateHandle('MyShop')).toBe(true); // normalized to lowercase
    });

    it('should return false for invalid handles', () => {
      expect(Seller.validateHandle('ab')).toBe(false); // too short
      expect(Seller.validateHandle('my@shop')).toBe(false); // invalid char
      expect(Seller.validateHandle('my shop')).toBe(false); // spaces
      expect(Seller.validateHandle('a'.repeat(31))).toBe(false); // too long
    });
  });

  describe('getShopPath()', () => {
    it('should return path with default locale', () => {
      const seller = SellerFactory.create({ handle: 'myshop' });

      expect(seller.getShopPath()).toBe('/ar-MA/shop/myshop');
    });

    it('should return path with custom locale', () => {
      const seller = SellerFactory.create({ handle: 'myshop' });

      expect(seller.getShopPath('en')).toBe('/en/shop/myshop');
    });
  });

  describe('getWhatsAppUrl()', () => {
    it('should return whatsapp URL without message', () => {
      const seller = SellerFactory.create({ whatsappNumber: '+212612345678' });

      expect(seller.getWhatsAppUrl()).toBe('https://wa.me/212612345678');
    });

    it('should return whatsapp URL with encoded message', () => {
      const seller = SellerFactory.create({ whatsappNumber: '+212612345678' });
      const url = seller.getWhatsAppUrl('Hello, I want to order!');

      expect(url).toBe(
        'https://wa.me/212612345678?text=Hello%2C%20I%20want%20to%20order!'
      );
    });
  });

  describe('updateProfile()', () => {
    it('should update shop name', () => {
      const seller = SellerFactory.create({ shopName: 'Old Name' });
      seller.updateProfile({ shopName: 'New Name' });

      expect(seller.shopName).toBe('New Name');
    });

    it('should trim updated shop name', () => {
      const seller = SellerFactory.create();
      seller.updateProfile({ shopName: '  Trimmed Name  ' });

      expect(seller.shopName).toBe('Trimmed Name');
    });

    it('should update whatsapp number', () => {
      const seller = SellerFactory.create({ whatsappNumber: '+212612345678' });
      seller.updateProfile({ whatsappNumber: '+212687654321' });

      expect(seller.whatsappNumber!.value).toBe('212687654321');
    });

    it('should throw error for empty shop name', () => {
      const seller = SellerFactory.create();

      expect(() => seller.updateProfile({ shopName: '' })).toThrow(
        'Shop name cannot be empty'
      );
    });

    it('should throw error for invalid phone number', () => {
      const seller = SellerFactory.create();

      expect(() => seller.updateProfile({ whatsappNumber: 'invalid' })).toThrow(
        'Invalid Moroccan phone number'
      );
    });

    it('should update updatedAt timestamp', () => {
      const seller = SellerFactory.create();
      const originalUpdatedAt = seller.updatedAt;

      seller.updateProfile({ shopName: 'Updated' });

      expect(seller.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('updateHandle()', () => {
    it('should update handle', () => {
      const seller = SellerFactory.create({ handle: 'oldhandle' });
      seller.updateHandle('newhandle');

      expect(seller.handle).toBe('newhandle');
    });

    it('should normalize new handle', () => {
      const seller = SellerFactory.create();
      seller.updateHandle('  NewHandle  ');

      expect(seller.handle).toBe('newhandle');
    });

    it('should throw error for invalid handle', () => {
      const seller = SellerFactory.create();

      expect(() => seller.updateHandle('ab')).toThrow(
        'Handle must be 3-30 characters, alphanumeric with underscores/hyphens only'
      );
    });
  });

  describe('updateShopConfig()', () => {
    it('should update shop config partially', () => {
      const seller = SellerFactory.fromPersistence({
        shopConfig: {
          heroText: 'Original',
          accentColor: '#000000',
        },
      });

      seller.updateShopConfig({ heroText: 'Updated' });

      expect(seller.shopConfig.heroText).toBe('Updated');
      expect(seller.shopConfig.accentColor).toBe('#000000');
    });

    it('should add new config fields', () => {
      const seller = SellerFactory.create();
      seller.updateShopConfig({
        heroText: 'Welcome!',
        showCategories: true,
      });

      expect(seller.shopConfig.heroText).toBe('Welcome!');
      expect(seller.shopConfig.showCategories).toBe(true);
    });

    it('should update updatedAt timestamp', () => {
      const seller = SellerFactory.create();
      const originalUpdatedAt = seller.updatedAt;

      seller.updateShopConfig({ heroText: 'Updated' });

      expect(seller.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('toPersistence()', () => {
    it('should serialize all properties', () => {
      const now = new Date();
      const seller = SellerFactory.fromPersistence({
        id: 'test-id',
        userId: 'user-id',
        shopName: 'Test Shop',
        handle: 'testshop',
        whatsappNumber: PhoneNumber.create('+212612345678'),
        shopConfig: {
          heroText: 'Welcome',
          accentColor: '#ffffff',
        },
        createdAt: now,
        updatedAt: now,
      });

      const persisted = seller.toPersistence();

      expect(persisted.id).toBe('test-id');
      expect(persisted.userId).toBe('user-id');
      expect(persisted.shopName).toBe('Test Shop');
      expect(persisted.handle).toBe('testshop');
      expect(persisted.whatsappNumber!.value).toBe('212612345678');
      expect(persisted.shopConfig.heroText).toBe('Welcome');
      expect(persisted.shopConfig.accentColor).toBe('#ffffff');
      expect(persisted.createdAt).toBe(now);
      expect(persisted.updatedAt).toBe(now);
    });

    it('should return a copy of shop config', () => {
      const seller = SellerFactory.create();
      const persisted = seller.toPersistence();

      persisted.shopConfig.heroText = 'Modified';

      expect(seller.shopConfig.heroText).not.toBe('Modified');
    });
  });

  describe('shopConfig getter returns copy', () => {
    it('should return a copy that does not modify original', () => {
      const seller = SellerFactory.fromPersistence({
        shopConfig: { heroText: 'Original' },
      });

      const config = seller.shopConfig;
      config.heroText = 'Modified';

      expect(seller.shopConfig.heroText).toBe('Original');
    });
  });
});
