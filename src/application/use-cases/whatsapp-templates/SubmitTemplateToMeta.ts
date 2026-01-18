/**
 * SubmitTemplateToMeta Use Case
 *
 * Submits a DRAFT template to Meta for approval.
 */

import type { WhatsAppTemplateRepository } from '@/domain/repositories/WhatsAppTemplateRepository';
import type { WhatsAppTokenRepository } from '@/domain/repositories/WhatsAppTokenRepository';
import { WhatsAppCloudApiService } from '@/infrastructure/external-services/WhatsAppCloudApiService';
import { decryptWhatsAppToken as decrypt } from '@/infrastructure/utils/encryption';
import type { TemplateCategory } from '@/domain/entities/WhatsAppMessageTemplate';
import type { SubmitTemplateResultDTO } from '@/application/dtos/WhatsAppTemplateDTO';

export interface SubmitTemplateInput {
  templateId: string;
  sellerId: string;
}

export interface SubmitTemplateOutput {
  success: boolean;
  result?: SubmitTemplateResultDTO;
  error?: string;
}

export class SubmitTemplateToMeta {
  constructor(
    private templateRepository: WhatsAppTemplateRepository,
    private whatsAppTokenRepository: WhatsAppTokenRepository
  ) {}

  async execute(input: SubmitTemplateInput): Promise<SubmitTemplateOutput> {
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

      // Check if template can be submitted
      if (!template.canSubmit()) {
        return {
          success: false,
          error: `Cannot submit template in ${template.status} status`,
        };
      }

      // Get WhatsApp token
      const token = await this.whatsAppTokenRepository.findBySellerId(input.sellerId);
      if (!token) {
        return {
          success: false,
          error: 'WhatsApp is not connected. Please connect WhatsApp Business first.',
        };
      }

      // Decrypt access token
      const accessToken = decrypt(token.accessTokenEncrypted);

      // Submit to Meta
      const whatsAppService = new WhatsAppCloudApiService();
      const metaFormat = template.toMetaApiFormat();

      const response = await whatsAppService.createMessageTemplate(
        token.businessAccountId,
        accessToken,
        {
          ...metaFormat,
          category: metaFormat.category as TemplateCategory,
        }
      );

      // Update template status
      template.markAsSubmitted();

      // If Meta returned status (usually PENDING), update accordingly
      // Note: Meta may return APPROVED immediately for certain template types
      if (response.status === 'APPROVED') {
        template.markAsApproved(response.id);
      }

      await this.templateRepository.update(template);

      return {
        success: true,
        result: {
          success: true,
          templateId: template.id,
          metaTemplateId: response.id,
          status: template.status,
        },
      };
    } catch (error) {
      // If Meta rejected the template immediately
      if (error instanceof Error && error.message.includes('template')) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit template',
      };
    }
  }
}
