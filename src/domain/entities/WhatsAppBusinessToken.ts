/**
 * WhatsApp Business Token Entity
 *
 * Represents an encrypted WhatsApp Business access token for a seller.
 * Tokens are stored separately from seller config for security isolation.
 */

export interface WhatsAppBusinessTokenProps {
  id: string;
  sellerId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  businessAccountId: string;
  accessTokenEncrypted: string;
  tokenExpiresAt: Date | null;
  isActive: boolean;
  connectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWhatsAppBusinessTokenInput {
  sellerId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  businessAccountId: string;
  accessTokenEncrypted: string;
  tokenExpiresAt?: Date | null;
}

export class WhatsAppBusinessToken {
  public readonly id: string;
  public readonly sellerId: string;
  public readonly phoneNumberId: string;
  private _displayPhoneNumber: string;
  private _businessAccountId: string;
  private _accessTokenEncrypted: string;
  private _tokenExpiresAt: Date | null;
  private _isActive: boolean;
  public readonly connectedAt: Date;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: WhatsAppBusinessTokenProps) {
    this.id = props.id;
    this.sellerId = props.sellerId;
    this.phoneNumberId = props.phoneNumberId;
    this._displayPhoneNumber = props.displayPhoneNumber;
    this._businessAccountId = props.businessAccountId;
    this._accessTokenEncrypted = props.accessTokenEncrypted;
    this._tokenExpiresAt = props.tokenExpiresAt;
    this._isActive = props.isActive;
    this.connectedAt = props.connectedAt;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Create a new WhatsApp Business token for storage
   */
  static create(input: CreateWhatsAppBusinessTokenInput): WhatsAppBusinessToken {
    const now = new Date();

    if (!input.sellerId) {
      throw new Error('Seller ID is required');
    }

    if (!input.phoneNumberId) {
      throw new Error('Phone Number ID is required');
    }

    if (!input.accessTokenEncrypted) {
      throw new Error('Encrypted access token is required');
    }

    return new WhatsAppBusinessToken({
      id: crypto.randomUUID(),
      sellerId: input.sellerId,
      phoneNumberId: input.phoneNumberId,
      displayPhoneNumber: input.displayPhoneNumber,
      businessAccountId: input.businessAccountId,
      accessTokenEncrypted: input.accessTokenEncrypted,
      tokenExpiresAt: input.tokenExpiresAt || null,
      isActive: true,
      connectedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  static fromPersistence(props: WhatsAppBusinessTokenProps): WhatsAppBusinessToken {
    return new WhatsAppBusinessToken(props);
  }

  // Getters
  get displayPhoneNumber(): string {
    return this._displayPhoneNumber;
  }

  get businessAccountId(): string {
    return this._businessAccountId;
  }

  get accessTokenEncrypted(): string {
    return this._accessTokenEncrypted;
  }

  get tokenExpiresAt(): Date | null {
    return this._tokenExpiresAt;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    if (!this._tokenExpiresAt) {
      return false; // Long-lived token without explicit expiration
    }
    return new Date() >= this._tokenExpiresAt;
  }

  /**
   * Check if token expires within given days
   */
  expiresWithinDays(days: number): boolean {
    if (!this._tokenExpiresAt) {
      return false;
    }
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    return this._tokenExpiresAt <= threshold;
  }

  /**
   * Update token after refresh
   */
  updateToken(newEncryptedToken: string, newExpiresAt?: Date | null): void {
    this._accessTokenEncrypted = newEncryptedToken;
    if (newExpiresAt !== undefined) {
      this._tokenExpiresAt = newExpiresAt;
    }
    this._updatedAt = new Date();
  }

  /**
   * Deactivate the connection
   */
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Reactivate the connection
   */
  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Serialize for persistence
   */
  toPersistence(): WhatsAppBusinessTokenProps {
    return {
      id: this.id,
      sellerId: this.sellerId,
      phoneNumberId: this.phoneNumberId,
      displayPhoneNumber: this._displayPhoneNumber,
      businessAccountId: this._businessAccountId,
      accessTokenEncrypted: this._accessTokenEncrypted,
      tokenExpiresAt: this._tokenExpiresAt,
      isActive: this._isActive,
      connectedAt: this.connectedAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
