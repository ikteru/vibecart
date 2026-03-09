/**
 * Order Entity (Aggregate Root)
 *
 * Represents a customer order with full lifecycle management.
 */

import { Money } from '../value-objects/Money';
import { Address, type AddressProps } from '../value-objects/Address';
import { PhoneNumber } from '../value-objects/PhoneNumber';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type FulfillmentType = 'delivery' | 'pickup';

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  price: Money;
  quantity: number;
  selectedVariant?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'buyer' | 'seller' | 'system';
  content: string;
  createdAt: Date;
}

export interface OrderProps {
  id: string;
  orderNumber: string;
  sellerId: string;
  customerName: string;
  customerPhone: PhoneNumber;
  shippingAddress: Address | null;
  fulfillmentType: FulfillmentType;
  pickupCode?: string;
  pickupScheduledTime?: string;
  pickupNotes?: string;
  pickupReadyAt?: Date;
  items: OrderItem[];
  subtotal: Money;
  shippingCost: Money;
  total: Money;
  status: OrderStatus;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface CreateOrderInput {
  sellerId: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType?: FulfillmentType;
  shippingAddress?: AddressProps;
  pickupScheduledTime?: string;
  pickupNotes?: string;
  items: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
    selectedVariant?: string;
  }[];
  shippingCost: number;
}

export class Order {
  public readonly id: string;
  public readonly orderNumber: string;
  public readonly sellerId: string;
  private _customerName: string;
  private _customerPhone: PhoneNumber;
  private _shippingAddress: Address | null;
  private _fulfillmentType: FulfillmentType;
  private _pickupCode: string | undefined;
  private _pickupScheduledTime: string | undefined;
  private _pickupNotes: string | undefined;
  private _pickupReadyAt: Date | null;
  private _items: OrderItem[];
  private _subtotal: Money;
  private _shippingCost: Money;
  private _total: Money;
  private _status: OrderStatus;
  private _messages: ChatMessage[];
  public readonly createdAt: Date;
  private _updatedAt: Date;
  private _confirmedAt: Date | null;
  private _shippedAt: Date | null;
  private _deliveredAt: Date | null;

  private constructor(props: OrderProps) {
    this.id = props.id;
    this.orderNumber = props.orderNumber;
    this.sellerId = props.sellerId;
    this._customerName = props.customerName;
    this._customerPhone = props.customerPhone;
    this._shippingAddress = props.shippingAddress;
    this._fulfillmentType = props.fulfillmentType;
    this._pickupCode = props.pickupCode;
    this._pickupScheduledTime = props.pickupScheduledTime;
    this._pickupNotes = props.pickupNotes;
    this._pickupReadyAt = props.pickupReadyAt || null;
    this._items = [...props.items];
    this._subtotal = props.subtotal;
    this._shippingCost = props.shippingCost;
    this._total = props.total;
    this._status = props.status;
    this._messages = [...props.messages];
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._confirmedAt = props.confirmedAt || null;
    this._shippedAt = props.shippedAt || null;
    this._deliveredAt = props.deliveredAt || null;
  }

  /**
   * Create a new Order
   */
  static create(input: CreateOrderInput): Order {
    const now = new Date();
    const fulfillmentType: FulfillmentType = input.fulfillmentType || 'delivery';

    // Validation
    if (!input.customerName || input.customerName.trim() === '') {
      throw new Error('Customer name is required');
    }
    if (input.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    // For delivery orders, address is required
    if (fulfillmentType === 'delivery' && !input.shippingAddress) {
      throw new Error('Shipping address is required for delivery orders');
    }

    // Calculate subtotal
    const subtotal = input.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    // Create order items
    const items: OrderItem[] = input.items.map((item) => ({
      id: crypto.randomUUID(),
      productId: item.productId,
      title: item.title,
      price: Money.create(item.price),
      quantity: item.quantity,
      selectedVariant: item.selectedVariant,
    }));

    // Generate order number
    const orderNumber = `ORD-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`;

    // Pickup orders are always free shipping; generate pickup code
    const shippingCost = fulfillmentType === 'pickup' ? 0 : input.shippingCost;
    const pickupCode = fulfillmentType === 'pickup'
      ? 'VC-' + Math.random().toString(36).slice(-4).toUpperCase()
      : undefined;

    return new Order({
      id: crypto.randomUUID(),
      orderNumber,
      sellerId: input.sellerId,
      customerName: input.customerName.trim(),
      customerPhone: PhoneNumber.create(input.customerPhone),
      shippingAddress: input.shippingAddress ? Address.create(input.shippingAddress) : null,
      fulfillmentType,
      pickupCode,
      pickupScheduledTime: input.pickupScheduledTime,
      pickupNotes: input.pickupNotes,
      items,
      subtotal: Money.create(subtotal),
      shippingCost: Money.create(shippingCost),
      total: Money.create(subtotal + shippingCost),
      status: 'pending',
      messages: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  static fromPersistence(props: OrderProps): Order {
    return new Order(props);
  }

  // Getters
  get customerName(): string {
    return this._customerName;
  }

  get customerPhone(): PhoneNumber {
    return this._customerPhone;
  }

  get shippingAddress(): Address | null {
    return this._shippingAddress;
  }

  get fulfillmentType(): FulfillmentType {
    return this._fulfillmentType;
  }

  get pickupCode(): string | undefined {
    return this._pickupCode;
  }

  get pickupScheduledTime(): string | undefined {
    return this._pickupScheduledTime;
  }

  get pickupNotes(): string | undefined {
    return this._pickupNotes;
  }

  get pickupReadyAt(): Date | null {
    return this._pickupReadyAt;
  }

  get isPickup(): boolean {
    return this._fulfillmentType === 'pickup';
  }

  get items(): OrderItem[] {
    return [...this._items];
  }

  get subtotal(): Money {
    return this._subtotal;
  }

  get shippingCost(): Money {
    return this._shippingCost;
  }

  get total(): Money {
    return this._total;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get messages(): ChatMessage[] {
    return [...this._messages];
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get confirmedAt(): Date | null {
    return this._confirmedAt;
  }

  get shippedAt(): Date | null {
    return this._shippedAt;
  }

  get deliveredAt(): Date | null {
    return this._deliveredAt;
  }

  // Status checks
  isPending(): boolean {
    return this._status === 'pending';
  }

  isConfirmed(): boolean {
    return this._status === 'confirmed';
  }

  isShipped(): boolean {
    return this._status === 'shipped';
  }

  isDelivered(): boolean {
    return this._status === 'delivered';
  }

  isCancelled(): boolean {
    return this._status === 'cancelled';
  }

  isCompleted(): boolean {
    return this._status === 'delivered' || this._status === 'cancelled';
  }

  // State transitions

  /**
   * Confirm the order
   * @throws Error if order is not pending
   */
  confirm(): void {
    if (this._status !== 'pending') {
      throw new Error(`Cannot confirm order in status: ${this._status}`);
    }
    this._status = 'confirmed';
    this._confirmedAt = new Date();
    this._updatedAt = new Date();

    // Add system message
    this.addSystemMessage('Order confirmed by seller');
  }

  /**
   * Mark order as shipped
   * @throws Error if order is not confirmed
   */
  ship(trackingNumber?: string): void {
    if (this._status !== 'confirmed') {
      throw new Error(`Cannot ship order in status: ${this._status}`);
    }
    this._status = 'shipped';
    this._shippedAt = new Date();
    this._updatedAt = new Date();

    // Add system message
    const message = trackingNumber
      ? `Order shipped. Tracking: ${trackingNumber}`
      : 'Order shipped';
    this.addSystemMessage(message);
  }

  /**
   * Mark order as delivered
   * @throws Error if order is not shipped
   */
  deliver(): void {
    if (this._status !== 'shipped') {
      throw new Error(`Cannot deliver order in status: ${this._status}`);
    }
    this._status = 'delivered';
    this._deliveredAt = new Date();
    this._updatedAt = new Date();

    // Add system message
    this.addSystemMessage('Order delivered successfully');
  }

  /**
   * Cancel the order
   * @throws Error if order is already completed
   */
  cancel(reason?: string): void {
    if (this.isCompleted()) {
      throw new Error(`Cannot cancel order in status: ${this._status}`);
    }
    this._status = 'cancelled';
    this._updatedAt = new Date();

    // Add system message
    const message = reason ? `Order cancelled: ${reason}` : 'Order cancelled';
    this.addSystemMessage(message);
  }

  // Chat functionality

  /**
   * Add a message from the seller
   */
  addSellerMessage(content: string): ChatMessage {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'seller',
      content: content.trim(),
      createdAt: new Date(),
    };
    this._messages.push(message);
    this._updatedAt = new Date();
    return message;
  }

  /**
   * Add a message from the buyer
   */
  addBuyerMessage(content: string): ChatMessage {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'buyer',
      content: content.trim(),
      createdAt: new Date(),
    };
    this._messages.push(message);
    this._updatedAt = new Date();
    return message;
  }

  /**
   * Add a system message
   */
  private addSystemMessage(content: string): ChatMessage {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'system',
      content,
      createdAt: new Date(),
    };
    this._messages.push(message);
    return message;
  }

  /**
   * Generate WhatsApp order message for seller
   */
  generateWhatsAppMessage(shopName: string): string {
    if (this._fulfillmentType === 'pickup') {
      return this.generatePickupWhatsAppMessage();
    }
    return this.generateDeliveryWhatsAppMessage(shopName);
  }

  private generateDeliveryWhatsAppMessage(shopName: string): string {
    const lines = [
      `🛒 *New Order from ${shopName}*`,
      '',
      `📦 *Order #${this.orderNumber}*`,
      '',
      '*Items:*',
    ];

    for (const item of this._items) {
      let itemLine = `• ${item.title} x${item.quantity} - ${item.price.multiply(item.quantity).format()}`;
      if (item.selectedVariant) {
        itemLine += ` (${item.selectedVariant})`;
      }
      lines.push(itemLine);
    }

    lines.push('');
    lines.push(`Subtotal: ${this._subtotal.format()}`);
    lines.push(
      `Shipping: ${this._shippingCost.isZero() ? 'FREE' : this._shippingCost.format()}`
    );
    lines.push(`*Total: ${this._total.format()}*`);

    if (this._shippingAddress) {
      lines.push('');
      lines.push('📍 *Delivery Address:*');
      lines.push(this._shippingAddress.toWhatsAppFormat());
    }

    lines.push('');
    lines.push(`📱 Customer: ${this._customerName}`);
    lines.push(`📞 Phone: ${this._customerPhone.toDisplayFormat()}`);

    return lines.join('\n');
  }

  private generatePickupWhatsAppMessage(): string {
    const lines = [
      `🏪 *طلب استلام من المحل!*`,
      '',
      `📦 *طلب #${this.orderNumber}* | 🔑 كود الاستلام: *${this._pickupCode}*`,
      '',
      `🛍️ *المنتجات:*`,
    ];

    for (const item of this._items) {
      let itemLine = `• ${item.title} x${item.quantity} - ${item.price.multiply(item.quantity).format()}`;
      if (item.selectedVariant) {
        itemLine += ` (${item.selectedVariant})`;
      }
      lines.push(itemLine);
    }

    lines.push('');
    lines.push(`💰 *المجموع: ${this._total.format()}* (بدون تكلفة التوصيل 🎉)`);
    lines.push('');
    lines.push(`👤 ${this._customerName}`);
    lines.push(`📞 ${this._customerPhone.toDisplayFormat()}`);

    if (this._pickupScheduledTime) {
      lines.push(`⏰ وقت الاستلام المفضل: ${this._pickupScheduledTime}`);
    }
    if (this._pickupNotes) {
      lines.push(`📝 ${this._pickupNotes}`);
    }

    return lines.join('\n');
  }

  /**
   * Serialize for persistence
   */
  toPersistence(): OrderProps {
    return {
      id: this.id,
      orderNumber: this.orderNumber,
      sellerId: this.sellerId,
      customerName: this._customerName,
      customerPhone: this._customerPhone,
      shippingAddress: this._shippingAddress,
      fulfillmentType: this._fulfillmentType,
      pickupCode: this._pickupCode,
      pickupScheduledTime: this._pickupScheduledTime,
      pickupNotes: this._pickupNotes,
      pickupReadyAt: this._pickupReadyAt || undefined,
      items: [...this._items],
      subtotal: this._subtotal,
      shippingCost: this._shippingCost,
      total: this._total,
      status: this._status,
      messages: [...this._messages],
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      confirmedAt: this._confirmedAt || undefined,
      shippedAt: this._shippedAt || undefined,
      deliveredAt: this._deliveredAt || undefined,
    };
  }
}
