/**
 * WhatsApp Template Repository Interface
 *
 * Defines the contract for WhatsApp message template persistence operations.
 */

import {
  WhatsAppMessageTemplate,
  TemplateStatus,
} from '../entities/WhatsAppMessageTemplate';

export interface WhatsAppTemplateRepository {
  /**
   * Create a new template
   */
  create(template: WhatsAppMessageTemplate): Promise<void>;

  /**
   * Find template by ID
   */
  findById(id: string): Promise<WhatsAppMessageTemplate | null>;

  /**
   * Find template by seller ID and template name
   */
  findBySellerIdAndName(
    sellerId: string,
    templateName: string,
    language?: string
  ): Promise<WhatsAppMessageTemplate | null>;

  /**
   * Find template by Meta template ID
   */
  findByMetaTemplateId(metaTemplateId: string): Promise<WhatsAppMessageTemplate | null>;

  /**
   * Find templates by seller ID with optional filters
   */
  findBySellerId(
    sellerId: string,
    options?: {
      status?: TemplateStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<WhatsAppMessageTemplate[]>;

  /**
   * Update an existing template
   */
  update(template: WhatsAppMessageTemplate): Promise<void>;

  /**
   * Update template status (for Meta approval workflow)
   */
  updateStatus(
    id: string,
    status: TemplateStatus,
    options?: {
      metaTemplateId?: string;
      rejectionReason?: string;
    }
  ): Promise<void>;

  /**
   * Delete a template
   */
  delete(id: string): Promise<void>;

  /**
   * Count templates by seller ID with optional status filter
   */
  countBySellerId(sellerId: string, status?: TemplateStatus): Promise<number>;

  /**
   * Check if a template name already exists for a seller
   */
  existsBySellerIdAndName(
    sellerId: string,
    templateName: string,
    language?: string,
    excludeId?: string
  ): Promise<boolean>;
}
