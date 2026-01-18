/**
 * GetSellerTemplates Use Case
 *
 * Retrieves templates for a seller with optional filtering.
 */

import type { WhatsAppTemplateRepository } from '@/domain/repositories/WhatsAppTemplateRepository';
import { WhatsAppTemplateMapper } from '@/application/mappers/WhatsAppTemplateMapper';
import type {
  TemplateListResponseDTO,
  TemplateStatsDTO,
  WhatsAppTemplateDTO,
} from '@/application/dtos/WhatsAppTemplateDTO';
import type { TemplateStatus } from '@/domain/entities/WhatsAppMessageTemplate';

export interface GetSellerTemplatesInput {
  sellerId: string;
  status?: TemplateStatus;
  limit?: number;
  offset?: number;
}

export interface GetSellerTemplatesOutput {
  success: boolean;
  data?: TemplateListResponseDTO;
  error?: string;
}

export interface GetTemplateByIdInput {
  templateId: string;
  sellerId: string;
}

export interface GetTemplateByIdOutput {
  success: boolean;
  template?: WhatsAppTemplateDTO;
  error?: string;
}

export interface GetTemplateStatsInput {
  sellerId: string;
}

export interface GetTemplateStatsOutput {
  success: boolean;
  stats?: TemplateStatsDTO;
  error?: string;
}

export class GetSellerTemplates {
  constructor(private templateRepository: WhatsAppTemplateRepository) {}

  async execute(input: GetSellerTemplatesInput): Promise<GetSellerTemplatesOutput> {
    try {
      const limit = input.limit || 20;
      const offset = input.offset || 0;

      const templates = await this.templateRepository.findBySellerId(input.sellerId, {
        status: input.status,
        limit: limit + 1, // Fetch one extra to check if there's more
        offset,
      });

      const hasMore = templates.length > limit;
      const items = hasMore ? templates.slice(0, limit) : templates;
      const total = await this.templateRepository.countBySellerId(input.sellerId, input.status);

      return {
        success: true,
        data: {
          templates: WhatsAppTemplateMapper.toSummaryDTOArray(items),
          total,
          limit,
          offset,
          hasMore,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get templates',
      };
    }
  }

  async getById(input: GetTemplateByIdInput): Promise<GetTemplateByIdOutput> {
    try {
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

      return {
        success: true,
        template: WhatsAppTemplateMapper.toDTO(template),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get template',
      };
    }
  }

  async getStats(input: GetTemplateStatsInput): Promise<GetTemplateStatsOutput> {
    try {
      const [total, draft, pending, approved, rejected] = await Promise.all([
        this.templateRepository.countBySellerId(input.sellerId),
        this.templateRepository.countBySellerId(input.sellerId, 'DRAFT'),
        this.templateRepository.countBySellerId(input.sellerId, 'PENDING'),
        this.templateRepository.countBySellerId(input.sellerId, 'APPROVED'),
        this.templateRepository.countBySellerId(input.sellerId, 'REJECTED'),
      ]);

      return {
        success: true,
        stats: {
          total,
          draft,
          pending,
          approved,
          rejected,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get template stats',
      };
    }
  }
}
