/**
 * WhatsApp Command Log
 *
 * Tracks command history for analytics and debugging.
 */
export interface WhatsAppCommandLog {
  id: string;
  sellerId: string;
  buyerPhone: string;
  rawMessage: string;
  parsedCommand: string | null;
  commandArgs: Record<string, string>;
  executionResult: {
    success: boolean;
    response?: string;
    error?: string;
  };
  createdAt: Date;
}

/**
 * WhatsApp Command Repository Interface (Port)
 *
 * Defines the contract for command logging operations.
 */
export interface WhatsAppCommandRepository {
  /**
   * Log a command execution
   */
  log(entry: Omit<WhatsAppCommandLog, 'id' | 'createdAt'>): Promise<WhatsAppCommandLog>;

  /**
   * Find recent commands for a buyer
   */
  findByBuyerPhone(buyerPhone: string, options?: {
    sellerId?: string;
    limit?: number;
  }): Promise<WhatsAppCommandLog[]>;

  /**
   * Find commands by seller
   */
  findBySellerId(sellerId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<WhatsAppCommandLog[]>;
}
