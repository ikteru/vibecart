/**
 * Instagram Token Repository Interface
 *
 * Defines the contract for Instagram token persistence operations.
 */

import { InstagramToken } from '../entities/InstagramToken';

export interface InstagramTokenRepository {
  /**
   * Find token by seller ID
   * @returns Token if found, null otherwise
   */
  findBySellerId(sellerId: string): Promise<InstagramToken | null>;

  /**
   * Save a new token or update existing one
   * Uses upsert logic (one token per seller)
   */
  save(token: InstagramToken): Promise<void>;

  /**
   * Delete token by seller ID (disconnect Instagram)
   */
  deleteBySellerId(sellerId: string): Promise<void>;

  /**
   * Find all tokens expiring within given days
   * Used for proactive token refresh
   */
  findExpiringTokens(daysUntilExpiry: number): Promise<InstagramToken[]>;
}
