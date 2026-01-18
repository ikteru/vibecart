/**
 * CreateTemplate Use Case
 *
 * Creates a new WhatsApp message template in DRAFT status.
 * The template can later be submitted to Meta for approval.
 */

import { WhatsAppMessageTemplate } from '@/domain/entities/WhatsAppMessageTemplate';
import type { WhatsAppTemplateRepository } from '@/domain/repositories/WhatsAppTemplateRepository';
import { WhatsAppTemplateMapper } from '@/application/mappers/WhatsAppTemplateMapper';
import type { CreateTemplateDTO, WhatsAppTemplateDTO } from '@/application/dtos/WhatsAppTemplateDTO';

export interface CreateTemplateInput extends CreateTemplateDTO {
  sellerId: string;
}

export interface CreateTemplateOutput {
  success: boolean;
  template?: WhatsAppTemplateDTO;
  error?: string;
}

export class CreateTemplate {
  constructor(private templateRepository: WhatsAppTemplateRepository) {}

  async execute(input: CreateTemplateInput): Promise<CreateTemplateOutput> {
    try {
      // Check if template name already exists for this seller
      const exists = await this.templateRepository.existsBySellerIdAndName(
        input.sellerId,
        input.templateName,
        input.templateLanguage
      );

      if (exists) {
        return {
          success: false,
          error: `A template with name "${input.templateName}" already exists for this language`,
        };
      }

      // Create domain entity (validation happens here)
      const template = WhatsAppMessageTemplate.create({
        sellerId: input.sellerId,
        templateName: input.templateName,
        templateLanguage: input.templateLanguage,
        category: input.category,
        description: input.description,
        components: input.components,
      });

      // Save to repository
      await this.templateRepository.create(template);

      return {
        success: true,
        template: WhatsAppTemplateMapper.toDTO(template),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create template',
      };
    }
  }
}
