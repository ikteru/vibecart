/**
 * Address Value Object
 *
 * Represents a delivery address in Morocco.
 */

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface AddressProps {
  city: string;
  neighborhood?: string;
  street: string;
  location?: GeoLocation;
  locationUrl?: string;
  buildingName?: string;
  floor?: string;
  apartmentNumber?: string;
  deliveryInstructions?: string;
}

export class Address {
  public readonly city: string;
  public readonly neighborhood: string | null;
  public readonly street: string;
  public readonly location: GeoLocation | null;
  public readonly locationUrl: string | null;
  public readonly buildingName: string | null;
  public readonly floor: string | null;
  public readonly apartmentNumber: string | null;
  public readonly deliveryInstructions: string | null;

  private constructor(props: AddressProps) {
    this.city = props.city.trim();
    this.neighborhood = props.neighborhood?.trim() || null;
    this.street = props.street.trim();
    this.location = props.location || null;
    this.locationUrl = props.locationUrl || null;
    this.buildingName = props.buildingName?.trim() || null;
    this.floor = props.floor?.trim() || null;
    this.apartmentNumber = props.apartmentNumber?.trim() || null;
    this.deliveryInstructions = props.deliveryInstructions?.trim() || null;

    Object.freeze(this);
  }

  /**
   * Create a new Address
   * @throws Error if required fields are missing
   */
  static create(props: AddressProps): Address {
    if (!props.city || props.city.trim() === '') {
      throw new Error('City is required');
    }
    if (!props.street || props.street.trim() === '') {
      throw new Error('Street address is required');
    }

    return new Address(props);
  }

  /**
   * Check if GPS location is available
   */
  hasLocation(): boolean {
    return this.location !== null;
  }

  /**
   * Get Google Maps URL for the location
   */
  getGoogleMapsUrl(): string | null {
    if (!this.location) return null;
    return `https://www.google.com/maps?q=${this.location.lat},${this.location.lng}`;
  }

  /**
   * Format address for single-line display
   */
  toSingleLine(): string {
    const parts = [this.street];

    if (this.buildingName) {
      parts.push(this.buildingName);
    }
    if (this.apartmentNumber) {
      parts.push(`Apt ${this.apartmentNumber}`);
    }
    if (this.neighborhood) {
      parts.push(this.neighborhood);
    }
    parts.push(this.city);

    return parts.join(', ');
  }

  /**
   * Format address for multi-line display
   */
  toMultiLine(): string[] {
    const lines: string[] = [this.street];

    if (this.buildingName || this.apartmentNumber || this.floor) {
      const buildingParts: string[] = [];
      if (this.buildingName) buildingParts.push(this.buildingName);
      if (this.floor) buildingParts.push(`Floor ${this.floor}`);
      if (this.apartmentNumber) buildingParts.push(`Apt ${this.apartmentNumber}`);
      lines.push(buildingParts.join(', '));
    }

    if (this.neighborhood) {
      lines.push(this.neighborhood);
    }

    lines.push(this.city);

    return lines;
  }

  /**
   * Format for WhatsApp message
   */
  toWhatsAppFormat(): string {
    let address = this.toSingleLine();

    if (this.deliveryInstructions) {
      address += `\n📝 ${this.deliveryInstructions}`;
    }

    if (this.location) {
      address += `\n📍 ${this.getGoogleMapsUrl()}`;
    }

    return address;
  }

  /**
   * Check equality
   */
  equals(other: Address): boolean {
    return (
      this.city === other.city &&
      this.neighborhood === other.neighborhood &&
      this.street === other.street &&
      this.location?.lat === other.location?.lat &&
      this.location?.lng === other.location?.lng
    );
  }

  /**
   * Serialize for JSON/database
   */
  toJSON(): AddressProps {
    return {
      city: this.city,
      neighborhood: this.neighborhood || undefined,
      street: this.street,
      location: this.location || undefined,
      locationUrl: this.locationUrl || undefined,
      buildingName: this.buildingName || undefined,
      floor: this.floor || undefined,
      apartmentNumber: this.apartmentNumber || undefined,
      deliveryInstructions: this.deliveryInstructions || undefined,
    };
  }

  /**
   * Create from JSON/database
   */
  static fromJSON(json: AddressProps): Address {
    return Address.create(json);
  }
}
