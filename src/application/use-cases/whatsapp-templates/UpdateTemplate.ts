/**
 * UpdateTemplate Use Case
 *
 * Updates an existing template (only if DRAFT or REJECTED).
 */

import type { WhatsAppTemplateRepository } from '@/domain/repositories/WhatsAppTemplateRepository';
import { WhatsAppTemplateMapper } from '@/application/mappers/WhatsAppTemplateMapper';
import type { UpdateTemplateDTO, WhatsAppTemplateDTO } from '@/application/dtos/WhatsAppTemplateDTO';

export interface UpdateTemplateInput extends UpdateTemplateDTO {
  templateId: string;
  sellerId: string;
}

export interface UpdateTemplateOutput {
  success: boolean;
  template?: WhatsAppTemplateDTO;
  error?: string;
}

export class UpdateTemplate {
  constructor(private templateRepository: WhatsAppTemplateRepository) {}

  async execute(input: UpdateTemplateInput): Promise<UpdateTemplateOutput> {
    try {
      // Find template
      const template = await this.templateRepository.findById(input.templateId);

      if (!template) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      // Verify ownership
      if (template.sellerId !== input.sellerId) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      // Check if template can be edited
      if (!template.canEdit()) {
        return {
          success: false,
          error: `Cannot edit template in ${template.status} status`,
        };
      }

      // Check for name conflicts if name is being changed
      if (input.templateName && input.templateName !== template.templateName) {
        const exists = await this.templateRepository.existsBySellerIdAndName(
          input.sellerId,
          input.templateName,
          input.templateLanguage || template.templateLanguage,
          template.id
        );

        if (exists) {
          return {
            success: false,
            error: `A template with name "${input.templateName}" already exists for this language`,
          };
        }
      }

      // Update template
      template.update({
        templateName: input.templateName,
        templateLanguage: input.templateLanguage,
        category: input.category,
        description: input.description,
        components: input.components,
      });

      // Save to repository
      await this.templateRepository.update(template);

      return {
        success: true,
        template: WhatsAppTemplateMapper.toDTO(template),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update template',
      };
    }
  }
}
