/**
 * DeleteTemplate Use Case
 *
 * Deletes a template. If the template was submitted to Meta,
 * it will also be deleted from Meta.
 */

import type { WhatsAppTemplateRepository } from '@/domain/repositories/WhatsAppTemplateRepository';
import type { TemplateEventBindingRepository } from '@/domain/repositories/TemplateEventBindingRepository';
import type { WhatsAppTokenRepository } from '@/domain/repositories/WhatsAppTokenRepository';
import { WhatsAppCloudApiService } from '@/infrastructure/external-services/WhatsAppCloudApiService';
import { decryptWhatsAppToken as decrypt } from '@/infrastructure/utils/encryption';

export interface DeleteTemplateInput {
  templateId: string;
  sellerId: string;
}

export interface DeleteTemplateOutput {
  success: boolean;
  error?: string;
}

export class DeleteTemplate {
  constructor(
    private templateRepository: WhatsAppTemplateRepository,
    private bindingRepository: TemplateEventBindingRepository,
    private whatsAppTokenRepository?: WhatsAppTokenRepository
  ) {}

  async execute(input: DeleteTemplateInput): Promise<DeleteTemplateOutput> {
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

      // Delete from Meta if it was submitted
      if (template.metaTemplateId && this.whatsAppTokenRepository) {
        try {
          const token = await this.whatsAppTokenRepository.findBySellerId(input.sellerId);
          if (token) {
            const accessToken = decrypt(token.accessTokenEncrypted);
            const whatsAppService = new WhatsAppCloudApiService();

            await whatsAppService.deleteMessageTemplateById(template.metaTemplateId, accessToken);
          }
        } catch (error) {
          // Log but don't fail - template might already be deleted from Meta
          console.warn('Failed to delete template from Meta:', error);
        }
      }

      // Delete all event bindings for this template
      await this.bindingRepository.deleteByTemplateId(input.templateId);

      // Delete template from database
      await this.templateRepository.delete(input.templateId);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete template',
      };
    }
  }
}
