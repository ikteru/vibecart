/**
 * Product Entity
 *
 * Represents a product in the catalog.
 */

import { Money } from '../value-objects/Money';
import { ProductCategory, type ProductCategoryType } from '../value-objects/ProductCategory';

export interface ProductProps {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: Money;
  discountPrice?: Money;
  promotionLabel?: string;
  stock: number;
  videoUrl?: string;
  instagramMediaId?: string;
  category: ProductCategory;
  variants: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  sellerId: string;
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  promotionLabel?: string;
  stock: number;
  videoUrl?: string;
  instagramMediaId?: string;
  category: ProductCategoryType;
  variants?: string[];
}

export class Product {
  public readonly id: string;
  public readonly sellerId: string;
  private _title: string;
  private _description: string;
  private _price: Money;
  private _discountPrice: Money | null;
  private _promotionLabel: string | null;
  private _stock: number;
  private _videoUrl: string | null;
  private _instagramMediaId: string | null;
  private _category: ProductCategory;
  private _variants: string[];
  private _isActive: boolean;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ProductProps) {
    this.id = props.id;
    this.sellerId = props.sellerId;
    this._title = props.title;
    this._description = props.description;
    this._price = props.price;
    this._discountPrice = props.discountPrice || null;
    this._promotionLabel = props.promotionLabel || null;
    this._stock = props.stock;
    this._videoUrl = props.videoUrl || null;
    this._instagramMediaId = props.instagramMediaId || null;
    this._category = props.category;
    this._variants = [...props.variants];
    this._isActive = props.isActive;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Create a new Product for insertion
   */
  static create(input: CreateProductInput): Product {
    const now = new Date();

    // Validation
    if (!input.title || input.title.trim() === '') {
      throw new Error('Product title is required');
    }
    if (input.price <= 0) {
      throw new Error('Product price must be positive');
    }
    if (input.stock < 0) {
      throw new Error('Product stock cannot be negative');
    }
    if (!input.videoUrl && !input.instagramMediaId) {
      throw new Error('Product must have either a video URL or Instagram media');
    }

    return new Product({
      id: crypto.randomUUID(),
      sellerId: input.sellerId,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      price: Money.create(input.price),
      discountPrice: input.discountPrice
        ? Money.create(input.discountPrice)
        : undefined,
      promotionLabel: input.promotionLabel?.trim(),
      stock: input.stock,
      videoUrl: input.videoUrl,
      instagramMediaId: input.instagramMediaId,
      category: ProductCategory.create(input.category),
      variants: input.variants || [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  // Getters
  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get price(): Money {
    return this._price;
  }

  get discountPrice(): Money | null {
    return this._discountPrice;
  }

  get promotionLabel(): string | null {
    return this._promotionLabel;
  }

  get stock(): number {
    return this._stock;
  }

  get videoUrl(): string | null {
    return this._videoUrl;
  }

  get instagramMediaId(): string | null {
    return this._instagramMediaId;
  }

  get category(): ProductCategory {
    return this._category;
  }

  get variants(): string[] {
    return [...this._variants];
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Get the effective price (discount price if available, otherwise regular price)
   */
  get effectivePrice(): Money {
    return this._discountPrice || this._price;
  }

  /**
   * Check if product has a discount
   */
  hasDiscount(): boolean {
    return this._discountPrice !== null && this._discountPrice.isLessThan(this._price);
  }

  /**
   * Calculate discount percentage
   */
  getDiscountPercentage(): number {
    if (!this.hasDiscount()) return 0;
    const discount = this._price.amount - this._discountPrice!.amount;
    return Math.round((discount / this._price.amount) * 100);
  }

  /**
   * Check if product is in stock
   */
  isInStock(): boolean {
    return this._stock > 0;
  }

  /**
   * Check if stock is low (less than 10)
   */
  hasLowStock(): boolean {
    return this._stock > 0 && this._stock < 10;
  }

  /**
   * Check if product has variants
   */
  hasVariants(): boolean {
    return this._variants.length > 0;
  }

  /**
   * Check if a specific variant is valid
   */
  isValidVariant(variant: string): boolean {
    if (!this.hasVariants()) return true;
    return this._variants.includes(variant);
  }

  // Mutations (update internal state)

  /**
   * Update product details
   */
  updateDetails(input: {
    title?: string;
    description?: string;
    videoUrl?: string;
    instagramMediaId?: string;
    category?: ProductCategoryType;
    variants?: string[];
  }): void {
    if (input.title !== undefined) {
      if (!input.title.trim()) {
        throw new Error('Product title cannot be empty');
      }
      this._title = input.title.trim();
    }
    if (input.description !== undefined) {
      this._description = input.description.trim();
    }
    if (input.videoUrl !== undefined) {
      this._videoUrl = input.videoUrl || null;
    }
    if (input.instagramMediaId !== undefined) {
      this._instagramMediaId = input.instagramMediaId || null;
    }
    if (input.category !== undefined) {
      this._category = ProductCategory.create(input.category);
    }
    if (input.variants !== undefined) {
      this._variants = [...input.variants];
    }

    this._updatedAt = new Date();
  }

  /**
   * Update pricing
   */
  updatePricing(input: {
    price?: number;
    discountPrice?: number | null;
    promotionLabel?: string | null;
  }): void {
    if (input.price !== undefined) {
      if (input.price <= 0) {
        throw new Error('Product price must be positive');
      }
      this._price = Money.create(input.price);
    }
    if (input.discountPrice !== undefined) {
      this._discountPrice = input.discountPrice
        ? Money.create(input.discountPrice)
        : null;
    }
    if (input.promotionLabel !== undefined) {
      this._promotionLabel = input.promotionLabel?.trim() || null;
    }

    this._updatedAt = new Date();
  }

  /**
   * Update stock level
   */
  updateStock(newStock: number): void {
    if (newStock < 0) {
      throw new Error('Stock cannot be negative');
    }
    this._stock = newStock;
    this._updatedAt = new Date();
  }

  /**
   * Decrease stock by amount (e.g., after sale)
   * @throws Error if insufficient stock
   */
  decreaseStock(amount: number): void {
    if (amount <= 0) {
      throw new Error('Decrease amount must be positive');
    }
    if (this._stock < amount) {
      throw new Error(
        `Insufficient stock. Available: ${this._stock}, Requested: ${amount}`
      );
    }
    this._stock -= amount;
    this._updatedAt = new Date();
  }

  /**
   * Increase stock by amount (e.g., restocking)
   */
  increaseStock(amount: number): void {
    if (amount <= 0) {
      throw new Error('Increase amount must be positive');
    }
    this._stock += amount;
    this._updatedAt = new Date();
  }

  /**
   * Activate product (make visible in shop)
   */
  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Deactivate product (hide from shop)
   */
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Apply discount
   */
  applyDiscount(discountPrice: number, label?: string): void {
    if (discountPrice <= 0) {
      throw new Error('Discount price must be positive');
    }
    if (discountPrice >= this._price.amount) {
      throw new Error('Discount price must be less than regular price');
    }
    this._discountPrice = Money.create(discountPrice);
    this._promotionLabel = label?.trim() || null;
    this._updatedAt = new Date();
  }

  /**
   * Remove discount
   */
  removeDiscount(): void {
    this._discountPrice = null;
    this._promotionLabel = null;
    this._updatedAt = new Date();
  }

  /**
   * Serialize for persistence
   */
  toPersistence(): ProductProps {
    return {
      id: this.id,
      sellerId: this.sellerId,
      title: this._title,
      description: this._description,
      price: this._price,
      discountPrice: this._discountPrice || undefined,
      promotionLabel: this._promotionLabel || undefined,
      stock: this._stock,
      videoUrl: this._videoUrl || undefined,
      instagramMediaId: this._instagramMediaId || undefined,
      category: this._category,
      variants: [...this._variants],
      isActive: this._isActive,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
