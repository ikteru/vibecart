/**
 * WhatsApp Message Repository Interface
 *
 * Defines the contract for WhatsApp message persistence operations.
 */

import { WhatsAppMessage, MessageStatus } from '../entities/WhatsAppMessage';

export interface WhatsAppMessageRepository {
  /**
   * Create a new message record
   */
  create(message: WhatsAppMessage): Promise<void>;

  /**
   * Find message by ID
   */
  findById(id: string): Promise<WhatsAppMessage | null>;

  /**
   * Find message by WhatsApp message ID (wamid.xxx)
   */
  findByWhatsAppMessageId(whatsappMessageId: string): Promise<WhatsAppMessage | null>;

  /**
   * Update message status
   */
  updateStatus(
    id: string,
    status: MessageStatus,
    options?: {
      whatsappMessageId?: string;
      errorCode?: string;
      errorMessage?: string;
      timestamp?: Date;
    }
  ): Promise<void>;

  /**
   * Find messages by order ID
   */
  findByOrderId(orderId: string): Promise<WhatsAppMessage[]>;

  /**
   * Find messages by seller ID with pagination
   */
  findBySellerId(
    sellerId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: MessageStatus;
    }
  ): Promise<WhatsAppMessage[]>;

  /**
   * Count messages by seller ID and optional status filter
   */
  countBySellerId(sellerId: string, status?: MessageStatus): Promise<number>;
}
