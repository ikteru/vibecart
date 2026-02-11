import type {
  WhatsAppDispatchMessageInput,
  WhatsAppDispatchMessageDTO,
} from '@/application/dtos/DeliveryDTO';
import { PhoneNumber } from '@/domain/value-objects/PhoneNumber';

/**
 * GenerateWhatsAppDispatchMessage Use Case Output
 */
export interface GenerateWhatsAppDispatchMessageOutput {
  success: boolean;
  data?: WhatsAppDispatchMessageDTO;
  error?: string;
}

/**
 * GenerateWhatsAppDispatchMessage Use Case
 *
 * Generates a WhatsApp message for dispatching an order.
 */
export class GenerateWhatsAppDispatchMessage {
  async execute(
    input: WhatsAppDispatchMessageInput,
    deliveryPersonPhone: string
  ): Promise<GenerateWhatsAppDispatchMessageOutput> {
    try {
      const phone = PhoneNumber.create(deliveryPersonPhone);
      const message = this.buildMessage(input);
      const whatsappUrl = phone.toWhatsAppUrl(message);

      return {
        success: true,
        data: {
          message,
          whatsappUrl,
          deliveryPersonPhone: phone.value,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate message',
      };
    }
  }

  private buildMessage(input: WhatsAppDispatchMessageInput): string {
    const lines: string[] = [];
    const currency = input.currency || 'MAD';

    // Header
    lines.push('🚚 *New Delivery Request*');
    lines.push('');

    // Order info
    lines.push(`📦 *Order #${input.orderNumber}*`);
    lines.push('');

    // Customer info
    lines.push(`👤 *Customer:* ${input.customerName}`);
    lines.push(`📱 *Phone:* ${input.customerPhone}`);
    lines.push('');

    // Delivery address
    lines.push('📍 *Delivery Address:*');
    const addressParts: string[] = [];
    if (input.deliveryAddress.street) {
      addressParts.push(input.deliveryAddress.street);
    }
    if (input.deliveryAddress.buildingName) {
      addressParts.push(input.deliveryAddress.buildingName);
    }
    if (input.deliveryAddress.floor) {
      addressParts.push(`Floor ${input.deliveryAddress.floor}`);
    }
    if (input.deliveryAddress.apartmentNumber) {
      addressParts.push(`Apt ${input.deliveryAddress.apartmentNumber}`);
    }
    lines.push(addressParts.join(', '));

    if (input.deliveryAddress.neighborhood) {
      lines.push(`${input.deliveryAddress.neighborhood}, ${input.deliveryAddress.city}`);
    } else {
      lines.push(input.deliveryAddress.city);
    }

    if (input.deliveryAddress.deliveryInstructions) {
      lines.push(`📝 ${input.deliveryAddress.deliveryInstructions}`);
    }
    lines.push('');

    // Google Maps link
    if (input.deliveryAddress.locationUrl) {
      lines.push(`📍 Google Maps: ${input.deliveryAddress.locationUrl}`);
    } else if (input.deliveryAddress.location) {
      const { lat, lng } = input.deliveryAddress.location;
      lines.push(`📍 Google Maps: https://maps.google.com/?q=${lat},${lng}`);
    }
    lines.push('');

    // Items
    lines.push('🛒 *Items:*');
    for (const item of input.items) {
      let itemLine = `• ${item.title} x${item.quantity}`;
      if (item.selectedVariant) {
        itemLine += ` (${item.selectedVariant})`;
      }
      lines.push(itemLine);
    }
    lines.push('');

    // COD amount
    if (input.codAmount !== undefined && input.codAmount > 0) {
      const formattedAmount = (input.codAmount / 100).toFixed(2);
      lines.push(`💰 *COD to Collect:* ${formattedAmount} ${currency}`);
    }

    // Notes
    if (input.notes) {
      lines.push('');
      lines.push(`📋 *Notes:* ${input.notes}`);
    }

    return lines.join('\n');
  }
}
