/**
 * WhatsApp Template DTOs
 *
 * Data Transfer Objects for WhatsApp template-related operations.
 */

import type {
  TemplateCategory,
  TemplateStatus,
  TemplateLanguage,
  TemplateComponent,
} from '@/domain/entities/WhatsAppMessageTemplate';
import type { NotificationEventType } from '@/domain/entities/TemplateEventBinding';

/**
 * Template Response DTO
 *
 * Full template data for API responses.
 */
export interface WhatsAppTemplateDTO {
  id: string;
  sellerId: string;
  metaTemplateId: string | null;
  templateName: string;
  templateLanguage: TemplateLanguage;
  category: TemplateCategory;
  status: TemplateStatus;
  rejectionReason: string | null;
  description: string | null;
  components: TemplateComponent[];
  bodyText: string;
  headerText: string | null;
  variables: string[];
  canEdit: boolean;
  canSubmit: boolean;
  canUse: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Template Summary DTO
 *
 * Lightweight template data for lists.
 */
export interface WhatsAppTemplateSummaryDTO {
  id: string;
  templateName: string;
  templateLanguage: TemplateLanguage;
  category: TemplateCategory;
  status: TemplateStatus;
  description: string | null;
  bodyPreview: string;
  createdAt: string;
}

/**
 * Create Template Input DTO
 */
export interface CreateTemplateDTO {
  templateName: string;
  templateLanguage?: TemplateLanguage;
  category: TemplateCategory;
  description?: string;
  components: TemplateComponent[];
}

/**
 * Update Template Input DTO
 */
export interface UpdateTemplateDTO {
  templateName?: string;
  templateLanguage?: TemplateLanguage;
  category?: TemplateCategory;
  description?: string;
  components?: TemplateComponent[];
}

/**
 * Template List Response DTO
 */
export interface TemplateListResponseDTO {
  templates: WhatsAppTemplateSummaryDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Template Stats DTO
 */
export interface TemplateStatsDTO {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
}

/**
 * Event Binding DTO
 */
export interface TemplateEventBindingDTO {
  id: string;
  sellerId: string;
  eventType: NotificationEventType;
  eventLabel: string;
  eventDescription: string;
  templateId: string;
  templateName: string | null;
  templateStatus: TemplateStatus | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Assign Template to Event Input DTO
 */
export interface AssignTemplateToEventDTO {
  eventType: NotificationEventType;
  templateId: string;
}

/**
 * Event Binding List Response DTO
 */
export interface EventBindingListResponseDTO {
  bindings: TemplateEventBindingDTO[];
  availableEvents: {
    eventType: NotificationEventType;
    label: string;
    description: string;
    hasBinding: boolean;
  }[];
}

/**
 * Submit Template to Meta Result DTO
 */
export interface SubmitTemplateResultDTO {
  success: boolean;
  templateId: string;
  metaTemplateId?: string;
  status: TemplateStatus;
  error?: string;
}

/**
 * Sync Templates from Meta Result DTO
 */
export interface SyncTemplatesResultDTO {
  success: boolean;
  synced: number;
  updated: number;
  error?: string;
}

/**
 * Template Variable Info
 *
 * Standard variables that sellers can use in their templates.
 */
export interface TemplateVariableInfo {
  name: string;
  placeholder: string;
  description: string;
  example: string;
}

export const STANDARD_TEMPLATE_VARIABLES: TemplateVariableInfo[] = [
  {
    name: 'customer_name',
    placeholder: '{{1}}',
    description: "Customer's name",
    example: 'Ahmed',
  },
  {
    name: 'order_number',
    placeholder: '{{2}}',
    description: 'Order reference number',
    example: 'ORD-A1B2',
  },
  {
    name: 'total_amount',
    placeholder: '{{3}}',
    description: 'Order total with currency',
    example: '450 MAD',
  },
  {
    name: 'tracking_number',
    placeholder: '{{4}}',
    description: 'Shipping tracking number',
    example: 'MA123456789',
  },
  {
    name: 'shop_name',
    placeholder: '{{5}}',
    description: "Seller's shop name",
    example: 'Zara Shop',
  },
  {
    name: 'items_count',
    placeholder: '{{6}}',
    description: 'Number of items in order',
    example: '3',
  },
];
