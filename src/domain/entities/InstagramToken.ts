/**
 * Instagram Token Entity
 *
 * Represents an encrypted Instagram OAuth token for a seller.
 * Tokens are stored separately from seller config for security isolation.
 * Tracks token health status for proactive maintenance.
 */

export type InstagramTokenStatus =
  | 'active'
  | 'expiring'
  | 'expired'
  | 'revoked'
  | 'refresh_failed';

export interface InstagramTokenProps {
  id: string;
  sellerId: string;
  instagramUserId: string;
  instagramUsername: string;
  accessTokenEncrypted: string;
  tokenType: string;
  expiresAt: Date;
  scopes: string[];
  status: InstagramTokenStatus;
  lastValidatedAt: Date | null;
  refreshFailureCount: number;
  lastError: string | null;
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
  private _status: InstagramTokenStatus;
  private _lastValidatedAt: Date | null;
  private _refreshFailureCount: number;
  private _lastError: string | null;
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
    this._status = props.status;
    this._lastValidatedAt = props.lastValidatedAt;
    this._refreshFailureCount = props.refreshFailureCount;
    this._lastError = props.lastError;
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
      status: 'active',
      lastValidatedAt: now,
      refreshFailureCount: 0,
      lastError: null,
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

  get status(): InstagramTokenStatus {
    return this._status;
  }

  get lastValidatedAt(): Date | null {
    return this._lastValidatedAt;
  }

  get refreshFailureCount(): number {
    return this._refreshFailureCount;
  }

  get lastError(): string | null {
    return this._lastError;
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
   * Whether this token can be used for API calls
   */
  isUsable(): boolean {
    return (
      (this._status === 'active' || this._status === 'expiring') &&
      !this.isExpired()
    );
  }

  /**
   * Update token after successful refresh
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
    this._status = 'active';
    this._refreshFailureCount = 0;
    this._lastError = null;
    this._lastValidatedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Mark token as successfully validated
   */
  markAsActive(): void {
    this._status = 'active';
    this._lastValidatedAt = new Date();
    this._lastError = null;
    this._refreshFailureCount = 0;
    this._updatedAt = new Date();
  }

  /**
   * Mark token as revoked (needs reconnection)
   */
  markAsRevoked(reason: string): void {
    this._status = 'revoked';
    this._lastError = reason;
    this._updatedAt = new Date();
  }

  /**
   * Mark token as expired
   */
  markAsExpired(): void {
    this._status = 'expired';
    this._updatedAt = new Date();
  }

  /**
   * Record a refresh failure
   */
  markRefreshFailed(error: string): void {
    this._refreshFailureCount += 1;
    this._lastError = error;
    this._updatedAt = new Date();

    // After 3 failures, mark as revoked
    if (this._refreshFailureCount >= 3) {
      this._status = 'revoked';
    } else {
      this._status = 'refresh_failed';
    }
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
      status: this._status,
      lastValidatedAt: this._lastValidatedAt,
      refreshFailureCount: this._refreshFailureCount,
      lastError: this._lastError,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
