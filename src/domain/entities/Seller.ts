/**
 * Seller Entity
 *
 * Represents a seller/shop owner in the marketplace.
 */

import { PhoneNumber } from '../value-objects/PhoneNumber';

export interface ShippingRule {
  city: string;
  rate: number;
}

export interface ShippingConfig {
  defaultRate: number;
  freeShippingThreshold?: number;
  rules?: ShippingRule[];
}

export interface SpotlightConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  color: string;
}

export interface MakerBioConfig {
  enabled: boolean;
  name: string;
  role: string;
  bio: string;
  imageUrl?: string;
}

export interface PinnedReview {
  id: string;
  username: string;
  image: string;
  note: string;
}

export type ChatPlatform = 'whatsapp' | 'instagram';

export interface ChatReview {
  id: string;
  platform: ChatPlatform;
  screenshotUrl: string;
  customerName: string;
  createdAt: string;
}

export interface VibeConfig {
  spotlight?: SpotlightConfig;
  makerBio?: MakerBioConfig;
  pinnedReviews?: PinnedReview[];
  chatReviews?: ChatReview[];
}

export interface GoogleMapsConfig {
  enabled: boolean;
  placeName?: string;
  rating?: number;
  reviews?: number;
}

export interface InstagramConfig {
  isConnected: boolean;
  handle?: string;
  userId?: string;           // Instagram user ID for API calls
  tokenExpiresAt?: string;   // ISO date string for UI warning about expiring token
  followersCount?: number;   // Number of followers on the Instagram account
  profilePictureUrl?: string; // Instagram profile picture URL
}

export interface WhatsAppBusinessConfig {
  isConnected: boolean;
  phoneNumberId?: string;          // WhatsApp Phone Number ID for API calls
  displayPhoneNumber?: string;     // Human-readable phone number
  verifiedName?: string;           // Business verified name
  businessAccountId?: string;      // WhatsApp Business Account ID
  businessAccountName?: string;    // Business account name
  tokenExpiresAt?: string;         // ISO date string for UI warning
}

export interface ShopConfig {
  heroText?: string;
  accentColor?: string;
  showCategories?: boolean;
  instagramHandle?: string;
  logoUrl?: string;
  bannerUrl?: string;
  shipping?: ShippingConfig;
  vibe?: VibeConfig;
  googleMaps?: GoogleMapsConfig;
  instagram?: InstagramConfig;
  whatsappBusiness?: WhatsAppBusinessConfig;
}

export interface SellerProps {
  id: string;
  userId: string;
  shopName: string;
  handle: string;
  whatsappNumber: PhoneNumber;
  shopConfig: ShopConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSellerInput {
  userId: string;
  shopName: string;
  handle: string;
  whatsappNumber: string;
  shopConfig?: ShopConfig;
}

export class Seller {
  public readonly id: string;
  public readonly userId: string;
  private _shopName: string;
  private _handle: string;
  private _whatsappNumber: PhoneNumber;
  private _shopConfig: ShopConfig;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: SellerProps) {
    this.id = props.id;
    this.userId = props.userId;
    this._shopName = props.shopName;
    this._handle = props.handle;
    this._whatsappNumber = props.whatsappNumber;
    this._shopConfig = { ...props.shopConfig };
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Create a new Seller for insertion
   */
  static create(input: CreateSellerInput): Seller {
    const now = new Date();

    // Validation
    if (!input.shopName || input.shopName.trim() === '') {
      throw new Error('Shop name is required');
    }

    if (!input.handle || input.handle.trim() === '') {
      throw new Error('Handle is required');
    }

    const normalizedHandle = Seller.normalizeHandle(input.handle);
    if (!Seller.isValidHandle(normalizedHandle)) {
      throw new Error(
        'Handle must be 3-30 characters, alphanumeric with underscores/hyphens only'
      );
    }

    return new Seller({
      id: crypto.randomUUID(),
      userId: input.userId,
      shopName: input.shopName.trim(),
      handle: normalizedHandle,
      whatsappNumber: PhoneNumber.create(input.whatsappNumber),
      shopConfig: input.shopConfig || {},
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  static fromPersistence(props: SellerProps): Seller {
    return new Seller(props);
  }

  // Getters
  get shopName(): string {
    return this._shopName;
  }

  get handle(): string {
    return this._handle;
  }

  get whatsappNumber(): PhoneNumber {
    return this._whatsappNumber;
  }

  get shopConfig(): ShopConfig {
    return { ...this._shopConfig };
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Normalize handle (lowercase, trim)
   */
  private static normalizeHandle(handle: string): string {
    return handle.toLowerCase().trim();
  }

  /**
   * Validate handle format
   * Rules: 3-30 chars, alphanumeric, underscores, hyphens
   */
  private static isValidHandle(handle: string): boolean {
    const handleRegex = /^[a-z0-9_-]{3,30}$/;
    return handleRegex.test(handle);
  }

  /**
   * Check if a handle is valid
   */
  static validateHandle(handle: string): boolean {
    const normalized = Seller.normalizeHandle(handle);
    return Seller.isValidHandle(normalized);
  }

  /**
   * Get shop URL path
   */
  getShopPath(locale: string = 'ar-MA'): string {
    return `/${locale}/shop/${this._handle}`;
  }

  /**
   * Get WhatsApp URL
   */
  getWhatsAppUrl(message?: string): string {
    return this._whatsappNumber.toWhatsAppUrl(message);
  }

  // Mutations

  /**
   * Update shop profile
   */
  updateProfile(input: {
    shopName?: string;
    whatsappNumber?: string;
  }): void {
    if (input.shopName !== undefined) {
      if (!input.shopName.trim()) {
        throw new Error('Shop name cannot be empty');
      }
      this._shopName = input.shopName.trim();
    }

    if (input.whatsappNumber !== undefined) {
      this._whatsappNumber = PhoneNumber.create(input.whatsappNumber);
    }

    this._updatedAt = new Date();
  }

  /**
   * Update handle (requires uniqueness check at repository level)
   */
  updateHandle(newHandle: string): void {
    const normalized = Seller.normalizeHandle(newHandle);
    if (!Seller.isValidHandle(normalized)) {
      throw new Error(
        'Handle must be 3-30 characters, alphanumeric with underscores/hyphens only'
      );
    }
    this._handle = normalized;
    this._updatedAt = new Date();
  }

  /**
   * Update shop configuration
   */
  updateShopConfig(config: Partial<ShopConfig>): void {
    this._shopConfig = {
      ...this._shopConfig,
      ...config,
    };
    this._updatedAt = new Date();
  }

  /**
   * Serialize for persistence
   */
  toPersistence(): SellerProps {
    return {
      id: this.id,
      userId: this.userId,
      shopName: this._shopName,
      handle: this._handle,
      whatsappNumber: this._whatsappNumber,
      shopConfig: { ...this._shopConfig },
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
