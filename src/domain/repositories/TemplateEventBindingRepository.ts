/**
 * Template Event Binding Repository Interface
 *
 * Defines the contract for template-to-event binding persistence operations.
 */

import { TemplateEventBinding, NotificationEventType } from '../entities/TemplateEventBinding';

export interface TemplateEventBindingRepository {
  /**
   * Create a new event binding
   * Upserts if a binding already exists for the seller/event combination
   */
  upsert(binding: TemplateEventBinding): Promise<void>;

  /**
   * Find binding by ID
   */
  findById(id: string): Promise<TemplateEventBinding | null>;

  /**
   * Find binding by seller ID and event type
   */
  findBySellerIdAndEventType(
    sellerId: string,
    eventType: NotificationEventType
  ): Promise<TemplateEventBinding | null>;

  /**
   * Find all bindings for a seller
   */
  findBySellerId(sellerId: string): Promise<TemplateEventBinding[]>;

  /**
   * Find all bindings that use a specific template
   */
  findByTemplateId(templateId: string): Promise<TemplateEventBinding[]>;

  /**
   * Update an existing binding
   */
  update(binding: TemplateEventBinding): Promise<void>;

  /**
   * Delete a binding
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all bindings for a specific template
   * Called when a template is deleted
   */
  deleteByTemplateId(templateId: string): Promise<void>;

  /**
   * Get active binding with template info for notification sending
   * Returns null if no binding exists or template is not approved
   */
  getActiveBindingWithTemplate(
    sellerId: string,
    eventType: NotificationEventType
  ): Promise<{
    binding: TemplateEventBinding;
    templateName: string;
    templateLanguage: string;
    metaTemplateId: string | null;
    components: unknown[];
  } | null>;
}
