/**
 * WhatsApp Token Repository Interface
 *
 * Defines the contract for WhatsApp Business token persistence operations.
 */

import { WhatsAppBusinessToken } from '../entities/WhatsAppBusinessToken';

export interface WhatsAppTokenRepository {
  /**
   * Find token by seller ID
   * @returns Token if found, null otherwise
   */
  findBySellerId(sellerId: string): Promise<WhatsAppBusinessToken | null>;

  /**
   * Save a new token or update existing one
   * Uses upsert logic (one token per seller)
   */
  save(token: WhatsAppBusinessToken): Promise<void>;

  /**
   * Delete token by seller ID (disconnect WhatsApp)
   */
  deleteBySellerId(sellerId: string): Promise<void>;

  /**
   * Find all tokens expiring within given days
   * Used for proactive token refresh
   */
  findExpiringTokens(daysUntilExpiry: number): Promise<WhatsAppBusinessToken[]>;

  /**
   * Find all active tokens
   * Used for batch operations
   */
  findActiveTokens(): Promise<WhatsAppBusinessToken[]>;

  /**
   * Find token by WhatsApp Business phone number ID
   * Used to map incoming webhook messages to the correct seller
   */
  findByPhoneNumberId(phoneNumberId: string): Promise<WhatsAppBusinessToken | null>;
}
