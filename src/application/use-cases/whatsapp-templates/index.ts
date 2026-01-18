/**
 * WhatsApp Template Use Cases
 *
 * Handles template management operations including:
 * - CRUD operations for templates
 * - Meta API integration (submit/sync)
 * - Event binding management
 */

export { CreateTemplate } from './CreateTemplate';
export type { CreateTemplateInput, CreateTemplateOutput } from './CreateTemplate';

export { UpdateTemplate } from './UpdateTemplate';
export type { UpdateTemplateInput, UpdateTemplateOutput } from './UpdateTemplate';

export { DeleteTemplate } from './DeleteTemplate';
export type { DeleteTemplateInput, DeleteTemplateOutput } from './DeleteTemplate';

export { GetSellerTemplates } from './GetSellerTemplates';
export type {
  GetSellerTemplatesInput,
  GetSellerTemplatesOutput,
  GetTemplateByIdInput,
  GetTemplateByIdOutput,
  GetTemplateStatsInput,
  GetTemplateStatsOutput,
} from './GetSellerTemplates';

export { SubmitTemplateToMeta } from './SubmitTemplateToMeta';
export type { SubmitTemplateInput, SubmitTemplateOutput } from './SubmitTemplateToMeta';

export { SyncTemplatesFromMeta } from './SyncTemplatesFromMeta';
export type { SyncTemplatesInput, SyncTemplatesOutput } from './SyncTemplatesFromMeta';

export { AssignTemplateToEvent } from './AssignTemplateToEvent';
export type {
  AssignTemplateToEventInput,
  AssignTemplateToEventOutput,
  ToggleBindingInput,
  ToggleBindingOutput,
  RemoveBindingInput,
  RemoveBindingOutput,
} from './AssignTemplateToEvent';

export { GetEventBindings } from './GetEventBindings';
export type { GetEventBindingsInput, GetEventBindingsOutput } from './GetEventBindings';
