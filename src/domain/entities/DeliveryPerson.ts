/**
 * DeliveryPerson Entity
 *
 * Represents a delivery person saved by a seller for order dispatch.
 */

import { PhoneNumber } from '../value-objects/PhoneNumber';

export interface DeliveryPersonProps {
  id: string;
  sellerId: string;
  name: string;
  phone: PhoneNumber;
  notes?: string;
  isActive: boolean;
  dispatchCount: number;
  lastDispatchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeliveryPersonInput {
  sellerId: string;
  name: string;
  phone: string;
  notes?: string;
}

export interface UpdateDeliveryPersonInput {
  name?: string;
  phone?: string;
  notes?: string;
  isActive?: boolean;
}

export class DeliveryPerson {
  public readonly id: string;
  public readonly sellerId: string;
  private _name: string;
  private _phone: PhoneNumber;
  private _notes: string | null;
  private _isActive: boolean;
  private _dispatchCount: number;
  private _lastDispatchedAt: Date | null;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: DeliveryPersonProps) {
    this.id = props.id;
    this.sellerId = props.sellerId;
    this._name = props.name;
    this._phone = props.phone;
    this._notes = props.notes || null;
    this._isActive = props.isActive;
    this._dispatchCount = props.dispatchCount;
    this._lastDispatchedAt = props.lastDispatchedAt || null;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Create a new DeliveryPerson
   */
  static create(input: CreateDeliveryPersonInput): DeliveryPerson {
    const now = new Date();

    // Validation
    if (!input.name || input.name.trim() === '') {
      throw new Error('Delivery person name is required');
    }

    if (input.name.trim().length > 100) {
      throw new Error('Delivery person name must not exceed 100 characters');
    }

    const phone = PhoneNumber.create(input.phone);

    return new DeliveryPerson({
      id: crypto.randomUUID(),
      sellerId: input.sellerId,
      name: input.name.trim(),
      phone,
      notes: input.notes?.trim(),
      isActive: true,
      dispatchCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  static fromPersistence(props: DeliveryPersonProps): DeliveryPerson {
    return new DeliveryPerson(props);
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get phone(): PhoneNumber {
    return this._phone;
  }

  get notes(): string | null {
    return this._notes;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get dispatchCount(): number {
    return this._dispatchCount;
  }

  get lastDispatchedAt(): Date | null {
    return this._lastDispatchedAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Mutations

  /**
   * Update delivery person details
   */
  update(input: UpdateDeliveryPersonInput): void {
    if (input.name !== undefined) {
      if (!input.name || input.name.trim() === '') {
        throw new Error('Delivery person name is required');
      }
      if (input.name.trim().length > 100) {
        throw new Error('Delivery person name must not exceed 100 characters');
      }
      this._name = input.name.trim();
    }

    if (input.phone !== undefined) {
      this._phone = PhoneNumber.create(input.phone);
    }

    if (input.notes !== undefined) {
      this._notes = input.notes?.trim() || null;
    }

    if (input.isActive !== undefined) {
      this._isActive = input.isActive;
    }

    this._updatedAt = new Date();
  }

  /**
   * Activate the delivery person
   */
  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Deactivate the delivery person
   */
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Record a dispatch (called after dispatch is created)
   */
  recordDispatch(): void {
    this._dispatchCount += 1;
    this._lastDispatchedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Generate WhatsApp URL for direct message
   */
  getWhatsAppUrl(message?: string): string {
    return this._phone.toWhatsAppUrl(message);
  }

  /**
   * Serialize for persistence
   */
  toPersistence(): DeliveryPersonProps {
    return {
      id: this.id,
      sellerId: this.sellerId,
      name: this._name,
      phone: this._phone,
      notes: this._notes || undefined,
      isActive: this._isActive,
      dispatchCount: this._dispatchCount,
      lastDispatchedAt: this._lastDispatchedAt || undefined,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
