import { z } from 'zod';

/**
 * Moroccan phone number validation regex
 * Matches PhoneNumber value object requirements
 *
 * Valid formats:
 * - 0612345678 (local with leading 0)
 * - +212612345678 (international with +)
 * - 212612345678 (international without +)
 * - 00212612345678 (international with 00 prefix)
 * - 612345678 (9 digits without prefix - used in new UI)
 *
 * The first digit (after removing country code) must be 5, 6, or 7
 */
const moroccanPhoneRegex = /^(?:(?:\+|00)?212|0)?[567]\d{8}$/;

/**
 * Checkout form validation schema
 */
export const checkoutFormSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long'),

  phone: z
    .string()
    .min(1, 'Phone number is required')
    .transform((val) => val.replace(/[\s\-\(\)]/g, '')) // Remove spaces, dashes, parentheses
    .refine((val) => moroccanPhoneRegex.test(val), {
      message: 'Enter a valid Moroccan phone number',
    }),

  city: z.string().min(1, 'City is required'),

  address: z
    .string()
    .min(1, 'Street address is required')
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address is too long'),

  neighborhood: z.string().optional(),

  locationUrl: z.string().min(1, 'Location pin is required'),

  selectedVariant: z.string().optional(),

  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

/**
 * Individual field validators for real-time validation
 */
export const fieldValidators = {
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long'),

  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine(
      (val) => {
        const cleaned = val.replace(/[\s\-\(\)]/g, '');
        return moroccanPhoneRegex.test(cleaned);
      },
      { message: 'Enter a valid phone number starting with 5, 6, or 7' }
    ),

  city: z.string().min(1, 'City is required'),

  address: z
    .string()
    .min(1, 'Street address is required')
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address is too long'),

  locationUrl: z.string().min(1, 'Location pin is required'),
};

/**
 * Validate and normalize phone number to international format
 *
 * @param phone - Input phone number in various formats
 * @returns Validation result with optional formatted phone (always 212XXXXXXXXX format)
 */
export function validateAndFormatPhone(phone: string): {
  valid: boolean;
  error?: string;
  formatted?: string;
} {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  if (!cleaned) {
    return { valid: false, error: 'Phone number is required' };
  }

  if (!moroccanPhoneRegex.test(cleaned)) {
    return { valid: false, error: 'Enter a valid phone number starting with 5, 6, or 7' };
  }

  // Normalize to 212 format (same as PhoneNumber value object)
  let normalized = cleaned;
  if (normalized.startsWith('00212')) {
    normalized = normalized.slice(2);
  } else if (normalized.startsWith('+212')) {
    normalized = normalized.slice(1);
  } else if (normalized.startsWith('212')) {
    // Already in correct format
  } else if (normalized.startsWith('0')) {
    normalized = '212' + normalized.slice(1);
  } else if (/^[567]\d{8}$/.test(normalized)) {
    // Just 9 digits starting with 5, 6, or 7 - prepend 212
    normalized = '212' + normalized;
  }

  return { valid: true, formatted: normalized };
}

/**
 * Format phone for display as user types
 * Example: 0612345678 -> 06 12 34 56 78
 */
export function formatPhoneForDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('212')) {
    // International format: +212 6 12 34 56 78
    const local = cleaned.slice(3);
    if (local.length <= 1) return `+212 ${local}`;
    if (local.length <= 3) return `+212 ${local.slice(0, 1)} ${local.slice(1)}`;
    if (local.length <= 5) return `+212 ${local.slice(0, 1)} ${local.slice(1, 3)} ${local.slice(3)}`;
    if (local.length <= 7)
      return `+212 ${local.slice(0, 1)} ${local.slice(1, 3)} ${local.slice(3, 5)} ${local.slice(5)}`;
    return `+212 ${local.slice(0, 1)} ${local.slice(1, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
  }

  if (cleaned.startsWith('0')) {
    // Local format: 06 12 34 56 78
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4)}`;
    if (cleaned.length <= 8)
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  }

  return phone;
}
