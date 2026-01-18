/**
 * Data Transfer Objects (DTOs)
 *
 * Serializable representations for API boundaries.
 */

export type {
  ProductResponseDTO,
  CreateProductDTO,
  UpdateProductDTO,
  ProductListQueryDTO,
  ProductListResponseDTO,
} from './ProductDTO';

export type {
  SellerResponseDTO,
  PublicSellerDTO,
  CreateSellerDTO,
  UpdateSellerDTO,
  UpdateHandleDTO,
} from './SellerDTO';

export type {
  WhatsAppTemplateDTO,
  WhatsAppTemplateSummaryDTO,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  TemplateListResponseDTO,
  TemplateStatsDTO,
  TemplateEventBindingDTO,
  AssignTemplateToEventDTO,
  EventBindingListResponseDTO,
  SubmitTemplateResultDTO,
  SyncTemplatesResultDTO,
  TemplateVariableInfo,
} from './WhatsAppTemplateDTO';

export { STANDARD_TEMPLATE_VARIABLES } from './WhatsAppTemplateDTO';
