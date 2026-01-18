/**
 * WhatsAppTemplateMapper
 *
 * Maps WhatsAppMessageTemplate and TemplateEventBinding entities to DTOs.
 */

import { WhatsAppMessageTemplate } from '@/domain/entities/WhatsAppMessageTemplate';
import {
  TemplateEventBinding,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_DESCRIPTIONS,
} from '@/domain/entities/TemplateEventBinding';
import type {
  WhatsAppTemplateDTO,
  WhatsAppTemplateSummaryDTO,
  TemplateEventBindingDTO,
} from '@/application/dtos/WhatsAppTemplateDTO';

export class WhatsAppTemplateMapper {
  /**
   * Map template entity to full DTO
   */
  static toDTO(template: WhatsAppMessageTemplate): WhatsAppTemplateDTO {
    const bodyText = template.getBodyText();

    return {
      id: template.id,
      sellerId: template.sellerId,
      metaTemplateId: template.metaTemplateId || null,
      templateName: template.templateName,
      templateLanguage: template.templateLanguage,
      category: template.category,
      status: template.status,
      rejectionReason: template.rejectionReason || null,
      description: template.description || null,
      components: template.components,
      bodyText,
      headerText: template.getHeaderText() || null,
      variables: template.getVariables(),
      canEdit: template.canEdit(),
      canSubmit: template.canSubmit(),
      canUse: template.canUse(),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  /**
   * Map template entity to summary DTO
   */
  static toSummaryDTO(template: WhatsAppMessageTemplate): WhatsAppTemplateSummaryDTO {
    const bodyText = template.getBodyText();
    const maxPreviewLength = 100;

    return {
      id: template.id,
      templateName: template.templateName,
      templateLanguage: template.templateLanguage,
      category: template.category,
      status: template.status,
      description: template.description || null,
      bodyPreview:
        bodyText.length > maxPreviewLength ? bodyText.slice(0, maxPreviewLength) + '...' : bodyText,
      createdAt: template.createdAt.toISOString(),
    };
  }

  /**
   * Map array of templates to full DTOs
   */
  static toDTOArray(templates: WhatsAppMessageTemplate[]): WhatsAppTemplateDTO[] {
    return templates.map((t) => this.toDTO(t));
  }

  /**
   * Map array of templates to summary DTOs
   */
  static toSummaryDTOArray(templates: WhatsAppMessageTemplate[]): WhatsAppTemplateSummaryDTO[] {
    return templates.map((t) => this.toSummaryDTO(t));
  }
}

export class TemplateEventBindingMapper {
  /**
   * Map binding entity to DTO (without template details)
   */
  static toDTO(
    binding: TemplateEventBinding,
    templateInfo?: {
      name: string | null;
      status: string | null;
    }
  ): TemplateEventBindingDTO {
    return {
      id: binding.id,
      sellerId: binding.sellerId,
      eventType: binding.eventType,
      eventLabel: EVENT_TYPE_LABELS[binding.eventType],
      eventDescription: EVENT_TYPE_DESCRIPTIONS[binding.eventType],
      templateId: binding.templateId,
      templateName: templateInfo?.name || null,
      templateStatus: (templateInfo?.status as TemplateEventBindingDTO['templateStatus']) || null,
      isEnabled: binding.isEnabled,
      createdAt: binding.createdAt.toISOString(),
      updatedAt: binding.updatedAt.toISOString(),
    };
  }

  /**
   * Map array of bindings to DTOs
   */
  static toDTOArray(
    bindings: TemplateEventBinding[],
    templateInfoMap?: Map<string, { name: string; status: string }>
  ): TemplateEventBindingDTO[] {
    return bindings.map((b) => {
      const templateInfo = templateInfoMap?.get(b.templateId);
      return this.toDTO(b, templateInfo);
    });
  }
}
