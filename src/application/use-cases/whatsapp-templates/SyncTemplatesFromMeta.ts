/**
 * SyncTemplatesFromMeta Use Case
 *
 * Fetches all templates from Meta and updates local status.
 * This syncs approval/rejection status for PENDING templates.
 */

import type { WhatsAppTemplateRepository } from '@/domain/repositories/WhatsAppTemplateRepository';
import type { WhatsAppTokenRepository } from '@/domain/repositories/WhatsAppTokenRepository';
import { WhatsAppCloudApiService } from '@/infrastructure/external-services/WhatsAppCloudApiService';
import { decryptWhatsAppToken as decrypt } from '@/infrastructure/utils/encryption';
import type { SyncTemplatesResultDTO } from '@/application/dtos/WhatsAppTemplateDTO';
import type { TemplateStatus } from '@/domain/entities/WhatsAppMessageTemplate';

export interface SyncTemplatesInput {
  sellerId: string;
}

export interface SyncTemplatesOutput {
  success: boolean;
  result?: SyncTemplatesResultDTO;
  error?: string;
}

export class SyncTemplatesFromMeta {
  constructor(
    private templateRepository: WhatsAppTemplateRepository,
    private whatsAppTokenRepository: WhatsAppTokenRepository
  ) {}

  async execute(input: SyncTemplatesInput): Promise<SyncTemplatesOutput> {
    try {
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

      // Fetch templates from Meta
      const whatsAppService = new WhatsAppCloudApiService();
      const response = await whatsAppService.getMessageTemplates(
        token.businessAccountId,
        accessToken
      );

      // Build a map of Meta templates by name + language
      const metaTemplatesMap = new Map<
        string,
        {
          id: string;
          status: string;
          rejectedReason?: string;
        }
      >();

      for (const metaTemplate of response.data) {
        const key = `${metaTemplate.name}:${metaTemplate.language}`;
        metaTemplatesMap.set(key, {
          id: metaTemplate.id,
          status: metaTemplate.status,
          rejectedReason: metaTemplate.rejected_reason,
        });
      }

      // Get all templates for this seller that need syncing (PENDING status)
      const localTemplates = await this.templateRepository.findBySellerId(input.sellerId, {
        status: 'PENDING',
      });

      let synced = 0;
      let updated = 0;

      for (const template of localTemplates) {
        const key = `${template.templateName}:${template.templateLanguage}`;
        const metaInfo = metaTemplatesMap.get(key);

        if (metaInfo) {
          synced++;
          const newStatus = this.mapMetaStatus(metaInfo.status);

          if (newStatus !== template.status) {
            updated++;

            if (newStatus === 'APPROVED') {
              await this.templateRepository.updateStatus(template.id, 'APPROVED', {
                metaTemplateId: metaInfo.id,
              });
            } else if (newStatus === 'REJECTED') {
              await this.templateRepository.updateStatus(template.id, 'REJECTED', {
                rejectionReason: metaInfo.rejectedReason,
              });
            }
          }
        }
      }

      return {
        success: true,
        result: {
          success: true,
          synced,
          updated,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync templates',
      };
    }
  }

  private mapMetaStatus(metaStatus: string): TemplateStatus {
    switch (metaStatus.toUpperCase()) {
      case 'APPROVED':
        return 'APPROVED';
      case 'REJECTED':
        return 'REJECTED';
      case 'PENDING':
      case 'IN_APPEAL':
        return 'PENDING';
      default:
        return 'PENDING';
    }
  }
}
