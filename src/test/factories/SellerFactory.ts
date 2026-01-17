/**
 * SellerFactory
 *
 * Test factory for creating Seller instances with sensible defaults.
 */

import { Seller, CreateSellerInput, SellerProps } from '@/domain/entities/Seller';
import { PhoneNumber } from '@/domain/value-objects/PhoneNumber';

type PartialSellerInput = Partial<CreateSellerInput>;
type PartialSellerProps = Partial<SellerProps>;

export const SellerFactory = {
  /**
   * Create a new Seller using the create() factory method
   */
  create(overrides: PartialSellerInput = {}): Seller {
    const defaults: CreateSellerInput = {
      userId: 'test-user-id',
      shopName: 'Test Shop',
      handle: 'testshop',
      whatsappNumber: '+212612345678',
      shopConfig: {},
    };

    return Seller.create({
      ...defaults,
      ...overrides,
    });
  },

  /**
   * Create a Seller from persistence (simulating database retrieval)
   */
  fromPersistence(overrides: PartialSellerProps = {}): Seller {
    const now = new Date();
    const defaults: SellerProps = {
      id: 'test-seller-id',
      userId: 'test-user-id',
      shopName: 'Test Shop',
      handle: 'testshop',
      whatsappNumber: PhoneNumber.create('+212612345678'),
      shopConfig: {
        heroText: 'Welcome to our shop!',
        accentColor: '#10b981',
        showCategories: true,
      },
      createdAt: now,
      updatedAt: now,
    };

    return Seller.fromPersistence({
      ...defaults,
      ...overrides,
    });
  },

  /**
   * Create a Seller with custom shop config
   */
  withShopConfig(config: Partial<SellerProps['shopConfig']>): Seller {
    return SellerFactory.fromPersistence({
      shopConfig: {
        heroText: 'Welcome to our shop!',
        accentColor: '#10b981',
        showCategories: true,
        ...config,
      },
    });
  },

  /**
   * Create a Seller with a specific handle
   */
  withHandle(handle: string): Seller {
    return SellerFactory.create({ handle });
  },
};
