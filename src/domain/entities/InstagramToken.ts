/**
 * Instagram Token Entity
 *
 * Represents an encrypted Instagram OAuth token for a seller.
 * Tokens are stored separately from seller config for security isolation.
 */

export interface InstagramTokenProps {
  id: string;
  sellerId: string;
  instagramUserId: string;
  instagramUsername: string;
  accessTokenEncrypted: string;
  tokenType: string;
  expiresAt: Date;
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInstagramTokenInput {
  sellerId: string;
  instagramUserId: string;
  instagramUsername: string;
  accessTokenEncrypted: string;
  tokenType?: string;
  expiresAt: Date;
  scopes?: string[];
}

export class InstagramToken {
  public readonly id: string;
  public readonly sellerId: string;
  public readonly instagramUserId: string;
  private _instagramUsername: string;
  private _accessTokenEncrypted: string;
  private _tokenType: string;
  private _expiresAt: Date;
  private _scopes: string[];
  public readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: InstagramTokenProps) {
    this.id = props.id;
    this.sellerId = props.sellerId;
    this.instagramUserId = props.instagramUserId;
    this._instagramUsername = props.instagramUsername;
    this._accessTokenEncrypted = props.accessTokenEncrypted;
    this._tokenType = props.tokenType;
    this._expiresAt = props.expiresAt;
    this._scopes = [...props.scopes];
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Create a new Instagram token for storage
   */
  static create(input: CreateInstagramTokenInput): InstagramToken {
    const now = new Date();

    if (!input.sellerId) {
      throw new Error('Seller ID is required');
    }

    if (!input.instagramUserId) {
      throw new Error('Instagram user ID is required');
    }

    if (!input.accessTokenEncrypted) {
      throw new Error('Encrypted access token is required');
    }

    return new InstagramToken({
      id: crypto.randomUUID(),
      sellerId: input.sellerId,
      instagramUserId: input.instagramUserId,
      instagramUsername: input.instagramUsername,
      accessTokenEncrypted: input.accessTokenEncrypted,
      tokenType: input.tokenType || 'bearer',
      expiresAt: input.expiresAt,
      scopes: input.scopes || [],
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  static fromPersistence(props: InstagramTokenProps): InstagramToken {
    return new InstagramToken(props);
  }

  // Getters
  get instagramUsername(): string {
    return this._instagramUsername;
  }

  get accessTokenEncrypted(): string {
    return this._accessTokenEncrypted;
  }

  get tokenType(): string {
    return this._tokenType;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get scopes(): string[] {
    return [...this._scopes];
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    return new Date() >= this._expiresAt;
  }

  /**
   * Check if token expires within given days
   */
  expiresWithinDays(days: number): boolean {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    return this._expiresAt <= threshold;
  }

  /**
   * Update token after refresh
   */
  updateToken(
    newEncryptedToken: string,
    newExpiresAt: Date,
    newScopes?: string[]
  ): void {
    this._accessTokenEncrypted = newEncryptedToken;
    this._expiresAt = newExpiresAt;
    if (newScopes) {
      this._scopes = [...newScopes];
    }
    this._updatedAt = new Date();
  }

  /**
   * Serialize for persistence
   */
  toPersistence(): InstagramTokenProps {
    return {
      id: this.id,
      sellerId: this.sellerId,
      instagramUserId: this.instagramUserId,
      instagramUsername: this._instagramUsername,
      accessTokenEncrypted: this._accessTokenEncrypted,
      tokenType: this._tokenType,
      expiresAt: this._expiresAt,
      scopes: [...this._scopes],
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
