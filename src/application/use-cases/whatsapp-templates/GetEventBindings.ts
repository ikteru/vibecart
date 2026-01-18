/**
 * GetEventBindings Use Case
 *
 * Retrieves event bindings for a seller, showing which templates
 * are assigned to which notification events.
 */

import {
  NOTIFICATION_EVENT_TYPES,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_DESCRIPTIONS,
} from '@/domain/entities/TemplateEventBinding';
import type { NotificationEventType } from '@/domain/entities/TemplateEventBinding';
import type { WhatsAppTemplateRepository } from '@/domain/repositories/WhatsAppTemplateRepository';
import type { TemplateEventBindingRepository } from '@/domain/repositories/TemplateEventBindingRepository';
import { TemplateEventBindingMapper } from '@/application/mappers/WhatsAppTemplateMapper';
import type { EventBindingListResponseDTO } from '@/application/dtos/WhatsAppTemplateDTO';

export interface GetEventBindingsInput {
  sellerId: string;
}

export interface GetEventBindingsOutput {
  success: boolean;
  data?: EventBindingListResponseDTO;
  error?: string;
}

export class GetEventBindings {
  constructor(
    private templateRepository: WhatsAppTemplateRepository,
    private bindingRepository: TemplateEventBindingRepository
  ) {}

  async execute(input: GetEventBindingsInput): Promise<GetEventBindingsOutput> {
    try {
      // Get all bindings for the seller
      const bindings = await this.bindingRepository.findBySellerId(input.sellerId);

      // Get template info for each binding
      const templateInfoMap = new Map<string, { name: string; status: string }>();

      for (const binding of bindings) {
        const template = await this.templateRepository.findById(binding.templateId);
        if (template) {
          templateInfoMap.set(binding.templateId, {
            name: template.templateName,
            status: template.status,
          });
        }
      }

      // Map bindings to DTOs
      const bindingDTOs = TemplateEventBindingMapper.toDTOArray(bindings, templateInfoMap);

      // Build available events list
      const boundEventTypes = new Set(bindings.map((b) => b.eventType));

      const availableEvents = NOTIFICATION_EVENT_TYPES.map((eventType) => ({
        eventType,
        label: EVENT_TYPE_LABELS[eventType],
        description: EVENT_TYPE_DESCRIPTIONS[eventType],
        hasBinding: boundEventTypes.has(eventType),
      }));

      return {
        success: true,
        data: {
          bindings: bindingDTOs,
          availableEvents,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get event bindings',
      };
    }
  }

  /**
   * Get the active template for a specific event.
   * Used by SendOrderNotification to determine which template to use.
   */
  async getActiveTemplateForEvent(
    sellerId: string,
    eventType: NotificationEventType
  ): Promise<{
    templateName: string;
    templateLanguage: string;
    components: unknown[];
  } | null> {
    const result = await this.bindingRepository.getActiveBindingWithTemplate(sellerId, eventType);

    if (!result) {
      return null;
    }

    return {
      templateName: result.templateName,
      templateLanguage: result.templateLanguage,
      components: result.components,
    };
  }
}
