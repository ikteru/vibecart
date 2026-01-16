/**
 * PhoneNumber Value Object
 *
 * Represents a validated Moroccan phone number.
 * Handles formatting for WhatsApp integration.
 */

export class PhoneNumber {
  private constructor(public readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Create a new PhoneNumber from raw input
   * Accepts formats: 0612345678, +212612345678, 212612345678
   * @throws Error if phone number is invalid
   */
  static create(phone: string): PhoneNumber {
    const normalized = PhoneNumber.normalize(phone);

    if (!PhoneNumber.isValid(normalized)) {
      throw new Error(`Invalid Moroccan phone number: ${phone}`);
    }

    return new PhoneNumber(normalized);
  }

  /**
   * Try to create a PhoneNumber, returns null if invalid
   */
  static tryCreate(phone: string): PhoneNumber | null {
    try {
      return PhoneNumber.create(phone);
    } catch {
      return null;
    }
  }

  /**
   * Normalize phone number to international format (212XXXXXXXXX)
   */
  private static normalize(phone: string): string {
    // Remove all non-digit characters except leading +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Handle different formats
    if (cleaned.startsWith('+212')) {
      cleaned = cleaned.slice(1); // Remove +
    } else if (cleaned.startsWith('00212')) {
      cleaned = cleaned.slice(2); // Remove 00
    } else if (cleaned.startsWith('0')) {
      cleaned = '212' + cleaned.slice(1); // Replace leading 0 with 212
    }

    return cleaned;
  }

  /**
   * Validate Moroccan phone number
   * Format: 212 followed by 6, 7, or 5 and 8 more digits
   */
  private static isValid(phone: string): boolean {
    // Moroccan mobile: 212 + (6|7|5) + 8 digits
    const moroccanMobileRegex = /^212[567]\d{8}$/;
    return moroccanMobileRegex.test(phone);
  }

  /**
   * Check if a raw string is a valid phone number
   */
  static isValidFormat(phone: string): boolean {
    try {
      const normalized = PhoneNumber.normalize(phone);
      return PhoneNumber.isValid(normalized);
    } catch {
      return false;
    }
  }

  /**
   * Get phone number for WhatsApp API (without +)
   * Returns: 212612345678
   */
  toWhatsAppFormat(): string {
    return this.value;
  }

  /**
   * Get phone number for display (with +)
   * Returns: +212 6 12 34 56 78
   */
  toDisplayFormat(): string {
    const digits = this.value;
    // Format: +212 6 XX XX XX XX
    return `+${digits.slice(0, 3)} ${digits.slice(3, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }

  /**
   * Get local format (with 0)
   * Returns: 06 12 34 56 78
   */
  toLocalFormat(): string {
    const local = '0' + this.value.slice(3);
    return `${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
  }

  /**
   * Generate WhatsApp click-to-chat URL
   */
  toWhatsAppUrl(message?: string): string {
    const baseUrl = `https://wa.me/${this.value}`;
    if (message) {
      return `${baseUrl}?text=${encodeURIComponent(message)}`;
    }
    return baseUrl;
  }

  /**
   * Generate tel: URL for calling
   */
  toTelUrl(): string {
    return `tel:+${this.value}`;
  }

  /**
   * Check equality
   */
  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }

  /**
   * Serialize for JSON/database
   */
  toJSON(): string {
    return this.value;
  }

  /**
   * Create from JSON/database
   */
  static fromJSON(value: string): PhoneNumber {
    return new PhoneNumber(value);
  }
}
