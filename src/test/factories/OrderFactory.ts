import { Order, CreateOrderInput, OrderProps } from '@/domain/entities/Order';
import { Money } from '@/domain/value-objects/Money';
import { Address } from '@/domain/value-objects/Address';
import { PhoneNumber } from '@/domain/value-objects/PhoneNumber';

/**
 * OrderFactory
 *
 * Test factory for creating Order entities.
 */
export const OrderFactory = {
  /**
   * Create a new Order using the domain factory method
   */
  create(overrides?: Partial<CreateOrderInput>): Order {
    return Order.create({
      sellerId: 'test-seller-id',
      customerName: 'Test Customer',
      customerPhone: '0612345678',
      shippingAddress: {
        city: 'Casablanca',
        neighborhood: 'Maarif',
        street: '123 Test Street',
      },
      items: [
        {
          productId: 'test-product-id',
          title: 'Test Product',
          price: 100,
          quantity: 1,
        },
      ],
      shippingCost: 25,
      ...overrides,
    });
  },

  /**
   * Create an Order from persistence (for testing repository reconstruction)
   */
  createFromPersistence(overrides?: Partial<OrderProps>): Order {
    const now = new Date();

    return Order.fromPersistence({
      id: overrides?.id || crypto.randomUUID(),
      orderNumber: overrides?.orderNumber || `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      sellerId: 'test-seller-id',
      customerName: 'Test Customer',
      customerPhone: PhoneNumber.create('0612345678'),
      fulfillmentType: 'delivery',
      shippingAddress: Address.create({
        city: 'Casablanca',
        neighborhood: 'Maarif',
        street: '123 Test Street',
      }),
      items: [
        {
          id: crypto.randomUUID(),
          productId: 'test-product-id',
          title: 'Test Product',
          price: Money.create(100),
          quantity: 1,
        },
      ],
      subtotal: Money.create(100),
      shippingCost: Money.create(25),
      total: Money.create(125),
      status: 'pending',
      messages: [],
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
  },

  /**
   * Create multiple orders with different statuses
   */
  createOrderSet(sellerId: string): Order[] {
    return [
      OrderFactory.createFromPersistence({
        sellerId,
        orderNumber: 'ORD-0001',
        status: 'pending',
      }),
      OrderFactory.createFromPersistence({
        sellerId,
        orderNumber: 'ORD-0002',
        status: 'confirmed',
      }),
      OrderFactory.createFromPersistence({
        sellerId,
        orderNumber: 'ORD-0003',
        status: 'shipped',
      }),
      OrderFactory.createFromPersistence({
        sellerId,
        orderNumber: 'ORD-0004',
        status: 'delivered',
      }),
    ];
  },

  /**
   * Create an order with multiple items
   */
  createWithMultipleItems(overrides?: Partial<CreateOrderInput>): Order {
    return Order.create({
      sellerId: 'test-seller-id',
      customerName: 'Test Customer',
      customerPhone: '0612345678',
      shippingAddress: {
        city: 'Marrakech',
        street: '456 Multi Item Street',
      },
      items: [
        {
          productId: 'product-1',
          title: 'Berber Rug',
          price: 450,
          quantity: 2,
          selectedVariant: 'Large',
        },
        {
          productId: 'product-2',
          title: 'Ceramic Vase',
          price: 180,
          quantity: 1,
        },
        {
          productId: 'product-3',
          title: 'Argan Oil Set',
          price: 120,
          quantity: 3,
        },
      ],
      shippingCost: 35,
      ...overrides,
    });
  },
};
