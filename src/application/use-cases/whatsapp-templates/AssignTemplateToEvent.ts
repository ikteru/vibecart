/**
 * AssignTemplateToEvent Use Case
 *
 * Assigns an APPROVED template to a specific order notification event.
 */

import { TemplateEventBinding } from '@/domain/entities/TemplateEventBinding';
import type { NotificationEventType } from '@/domain/entities/TemplateEventBinding';
import type { WhatsAppTemplateRepository } from '@/domain/repositories/WhatsAppTemplateRepository';
import type { TemplateEventBindingRepository } from '@/domain/repositories/TemplateEventBindingRepository';
import { TemplateEventBindingMapper } from '@/application/mappers/WhatsAppTemplateMapper';
import type { TemplateEventBindingDTO } from '@/application/dtos/WhatsAppTemplateDTO';

export interface AssignTemplateToEventInput {
  sellerId: string;
  eventType: NotificationEventType;
  templateId: string;
}

export interface AssignTemplateToEventOutput {
  success: boolean;
  binding?: TemplateEventBindingDTO;
  error?: string;
}

export interface ToggleBindingInput {
  sellerId: string;
  eventType: NotificationEventType;
  enabled: boolean;
}

export interface ToggleBindingOutput {
  success: boolean;
  error?: string;
}

export interface RemoveBindingInput {
  sellerId: string;
  eventType: NotificationEventType;
}

export interface RemoveBindingOutput {
  success: boolean;
  error?: string;
}

export class AssignTemplateToEvent {
  constructor(
    private templateRepository: WhatsAppTemplateRepository,
    private bindingRepository: TemplateEventBindingRepository
  ) {}

  async execute(input: AssignTemplateToEventInput): Promise<AssignTemplateToEventOutput> {
    try {
      // Verify template exists and is owned by seller
      const template = await this.templateRepository.findById(input.templateId);

      if (!template) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      if (template.sellerId !== input.sellerId) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      // Verify template is approved
      if (!template.canUse()) {
        return {
          success: false,
          error: `Cannot assign template in ${template.status} status. Only APPROVED templates can be assigned to events.`,
        };
      }

      // Check if binding already exists
      const existingBinding = await this.bindingRepository.findBySellerIdAndEventType(
        input.sellerId,
        input.eventType
      );

      let binding: TemplateEventBinding;

      if (existingBinding) {
        // Update existing binding
        existingBinding.updateTemplate(input.templateId);
        existingBinding.enable();
        await this.bindingRepository.update(existingBinding);
        binding = existingBinding;
      } else {
        // Create new binding
        binding = TemplateEventBinding.create({
          sellerId: input.sellerId,
          eventType: input.eventType,
          templateId: input.templateId,
        });
        await this.bindingRepository.upsert(binding);
      }

      return {
        success: true,
        binding: TemplateEventBindingMapper.toDTO(binding, {
          name: template.templateName,
          status: template.status,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign template',
      };
    }
  }

  async toggle(input: ToggleBindingInput): Promise<ToggleBindingOutput> {
    try {
      const binding = await this.bindingRepository.findBySellerIdAndEventType(
        input.sellerId,
        input.eventType
      );

      if (!binding) {
        return {
          success: false,
          error: 'Binding not found',
        };
      }

      if (input.enabled) {
        binding.enable();
      } else {
        binding.disable();
      }

      await this.bindingRepository.update(binding);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle binding',
      };
    }
  }

  async remove(input: RemoveBindingInput): Promise<RemoveBindingOutput> {
    try {
      const binding = await this.bindingRepository.findBySellerIdAndEventType(
        input.sellerId,
        input.eventType
      );

      if (!binding) {
        return {
          success: false,
          error: 'Binding not found',
        };
      }

      await this.bindingRepository.delete(binding.id);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove binding',
      };
    }
  }
}
