/**
 * OrderDispatch Entity
 *
 * Represents a dispatch record for an order to a delivery person.
 */

import { Money } from '../value-objects/Money';
import { PhoneNumber } from '../value-objects/PhoneNumber';

export type DispatchType = 'manual' | 'glovo' | 'amana' | 'maystro';

export type DispatchStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'returned';

export interface StatusHistoryEntry {
  status: DispatchStatus;
  timestamp: Date;
  note?: string;
}

export interface OrderDispatchProps {
  id: string;
  orderId: string;
  sellerId: string;
  dispatchType: DispatchType;

  // Manual dispatch
  deliveryPersonId?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: PhoneNumber;

  // API provider (Phase 2+)
  providerId?: string;
  externalTrackingId?: string;
  externalStatus?: string;

  // Pricing
  codAmount?: Money;

  // Status
  status: DispatchStatus;
  statusHistory: StatusHistoryEntry[];
  whatsappSentAt?: Date;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateManualDispatchInput {
  orderId: string;
  sellerId: string;
  deliveryPersonId: string;
  deliveryPersonName: string;
  deliveryPersonPhone: string;
  codAmount?: number;
  notes?: string;
}

export class OrderDispatch {
  public readonly id: string;
  public readonly orderId: string;
  public readonly sellerId: string;
  public readonly dispatchType: DispatchType;

  // Manual dispatch
  public readonly deliveryPersonId: string | null;
  private _deliveryPersonName: string | null;
  private _deliveryPersonPhone: PhoneNumber | null;

  // API provider
  public readonly providerId: string | null;
  private _externalTrackingId: string | null;
  private _externalStatus: string | null;

  // Pricing
  private _codAmount: Money | null;

  // Status
  private _status: DispatchStatus;
  private _statusHistory: StatusHistoryEntry[];
  private _whatsappSentAt: Date | null;
  private _notes: string | null;

  public readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: OrderDispatchProps) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.sellerId = props.sellerId;
    this.dispatchType = props.dispatchType;

    this.deliveryPersonId = props.deliveryPersonId || null;
    this._deliveryPersonName = props.deliveryPersonName || null;
    this._deliveryPersonPhone = props.deliveryPersonPhone || null;

    this.providerId = props.providerId || null;
    this._externalTrackingId = props.externalTrackingId || null;
    this._externalStatus = props.externalStatus || null;

    this._codAmount = props.codAmount || null;

    this._status = props.status;
    this._statusHistory = [...props.statusHistory];
    this._whatsappSentAt = props.whatsappSentAt || null;
    this._notes = props.notes || null;

    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Create a new manual dispatch
   */
  static createManual(input: CreateManualDispatchInput): OrderDispatch {
    const now = new Date();

    const phone = PhoneNumber.create(input.deliveryPersonPhone);

    const initialHistory: StatusHistoryEntry[] = [
      {
        status: 'pending',
        timestamp: now,
        note: 'Dispatch created',
      },
    ];

    return new OrderDispatch({
      id: crypto.randomUUID(),
      orderId: input.orderId,
      sellerId: input.sellerId,
      dispatchType: 'manual',
      deliveryPersonId: input.deliveryPersonId,
      deliveryPersonName: input.deliveryPersonName,
      deliveryPersonPhone: phone,
      codAmount: input.codAmount ? Money.create(input.codAmount) : undefined,
      status: 'pending',
      statusHistory: initialHistory,
      notes: input.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  static fromPersistence(props: OrderDispatchProps): OrderDispatch {
    return new OrderDispatch(props);
  }

  // Getters
  get deliveryPersonName(): string | null {
    return this._deliveryPersonName;
  }

  get deliveryPersonPhone(): PhoneNumber | null {
    return this._deliveryPersonPhone;
  }

  get externalTrackingId(): string | null {
    return this._externalTrackingId;
  }

  get externalStatus(): string | null {
    return this._externalStatus;
  }

  get codAmount(): Money | null {
    return this._codAmount;
  }

  get status(): DispatchStatus {
    return this._status;
  }

  get statusHistory(): StatusHistoryEntry[] {
    return [...this._statusHistory];
  }

  get whatsappSentAt(): Date | null {
    return this._whatsappSentAt;
  }

  get notes(): string | null {
    return this._notes;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Status checks
  isPending(): boolean {
    return this._status === 'pending';
  }

  isPickedUp(): boolean {
    return this._status === 'picked_up';
  }

  isInTransit(): boolean {
    return this._status === 'in_transit';
  }

  isDelivered(): boolean {
    return this._status === 'delivered';
  }

  isFailed(): boolean {
    return this._status === 'failed';
  }

  isReturned(): boolean {
    return this._status === 'returned';
  }

  isCompleted(): boolean {
    return ['delivered', 'failed', 'returned'].includes(this._status);
  }

  // Status transitions

  /**
   * Update status with history tracking
   */
  updateStatus(newStatus: DispatchStatus, note?: string): void {
    if (this.isCompleted() && newStatus !== this._status) {
      throw new Error(`Cannot change status from completed state: ${this._status}`);
    }

    this._status = newStatus;
    this._statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      note,
    });
    this._updatedAt = new Date();
  }

  /**
   * Mark as picked up
   */
  markPickedUp(note?: string): void {
    this.updateStatus('picked_up', note || 'Order picked up by delivery person');
  }

  /**
   * Mark as in transit
   */
  markInTransit(note?: string): void {
    this.updateStatus('in_transit', note || 'Order in transit');
  }

  /**
   * Mark as delivered
   */
  markDelivered(note?: string): void {
    this.updateStatus('delivered', note || 'Order delivered successfully');
  }

  /**
   * Mark as failed
   */
  markFailed(reason: string): void {
    this.updateStatus('failed', reason);
  }

  /**
   * Mark as returned
   */
  markReturned(reason: string): void {
    this.updateStatus('returned', reason);
  }

  /**
   * Record WhatsApp message sent
   */
  recordWhatsAppSent(): void {
    this._whatsappSentAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Update notes
   */
  updateNotes(notes: string): void {
    this._notes = notes.trim() || null;
    this._updatedAt = new Date();
  }

  /**
   * Get WhatsApp URL for the delivery person
   */
  getDeliveryPersonWhatsAppUrl(message?: string): string | null {
    if (!this._deliveryPersonPhone) return null;
    return this._deliveryPersonPhone.toWhatsAppUrl(message);
  }

  /**
   * Serialize for persistence
   */
  toPersistence(): OrderDispatchProps {
    return {
      id: this.id,
      orderId: this.orderId,
      sellerId: this.sellerId,
      dispatchType: this.dispatchType,
      deliveryPersonId: this.deliveryPersonId || undefined,
      deliveryPersonName: this._deliveryPersonName || undefined,
      deliveryPersonPhone: this._deliveryPersonPhone || undefined,
      providerId: this.providerId || undefined,
      externalTrackingId: this._externalTrackingId || undefined,
      externalStatus: this._externalStatus || undefined,
      codAmount: this._codAmount || undefined,
      status: this._status,
      statusHistory: [...this._statusHistory],
      whatsappSentAt: this._whatsappSentAt || undefined,
      notes: this._notes || undefined,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
