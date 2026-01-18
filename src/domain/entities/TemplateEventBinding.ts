/**
 * Template Event Binding Entity
 *
 * Links a WhatsApp message template to a specific order notification event.
 * Each seller can have one template assigned per event type.
 *
 * When an order event occurs (e.g., ORDER_CONFIRMED), the system looks up
 * the binding to determine which template to use for the notification.
 */

export type NotificationEventType =
  | 'ORDER_PENDING_CONFIRMATION'
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED';

export const NOTIFICATION_EVENT_TYPES: NotificationEventType[] = [
  'ORDER_PENDING_CONFIRMATION',
  'ORDER_CONFIRMED',
  'ORDER_SHIPPED',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED',
];

export interface TemplateEventBindingProps {
  id: string;
  sellerId: string;
  eventType: NotificationEventType;
  templateId: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBindingInput {
  sellerId: string;
  eventType: NotificationEventType;
  templateId: string;
}

export class TemplateEventBinding {
  public readonly id: string;
  public readonly sellerId: string;
  public readonly eventType: NotificationEventType;
  private _templateId: string;
  private _isEnabled: boolean;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: TemplateEventBindingProps) {
    this.id = props.id;
    this.sellerId = props.sellerId;
    this.eventType = props.eventType;
    this._templateId = props.templateId;
    this._isEnabled = props.isEnabled;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Create a new event binding
   */
  static create(input: CreateBindingInput): TemplateEventBinding {
    const now = new Date();

    if (!input.sellerId) {
      throw new Error('Seller ID is required');
    }

    if (!input.eventType) {
      throw new Error('Event type is required');
    }

    if (!NOTIFICATION_EVENT_TYPES.includes(input.eventType)) {
      throw new Error(`Invalid event type: ${input.eventType}`);
    }

    if (!input.templateId) {
      throw new Error('Template ID is required');
    }

    return new TemplateEventBinding({
      id: crypto.randomUUID(),
      sellerId: input.sellerId,
      eventType: input.eventType,
      templateId: input.templateId,
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  static fromPersistence(props: TemplateEventBindingProps): TemplateEventBinding {
    return new TemplateEventBinding(props);
  }

  // Getters
  get templateId(): string {
    return this._templateId;
  }

  get isEnabled(): boolean {
    return this._isEnabled;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Update the assigned template
   */
  updateTemplate(templateId: string): void {
    if (!templateId) {
      throw new Error('Template ID is required');
    }
    this._templateId = templateId;
    this._updatedAt = new Date();
  }

  /**
   * Enable the binding
   */
  enable(): void {
    this._isEnabled = true;
    this._updatedAt = new Date();
  }

  /**
   * Disable the binding
   */
  disable(): void {
    this._isEnabled = false;
    this._updatedAt = new Date();
  }

  /**
   * Toggle enabled state
   */
  toggleEnabled(): void {
    this._isEnabled = !this._isEnabled;
    this._updatedAt = new Date();
  }

  /**
   * Check if binding is active (enabled)
   */
  isActive(): boolean {
    return this._isEnabled;
  }

  /**
   * Serialize for persistence
   */
  toPersistence(): TemplateEventBindingProps {
    return {
      id: this.id,
      sellerId: this.sellerId,
      eventType: this.eventType,
      templateId: this._templateId,
      isEnabled: this._isEnabled,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

/**
 * Human-readable labels for event types
 */
export const EVENT_TYPE_LABELS: Record<NotificationEventType, string> = {
  ORDER_PENDING_CONFIRMATION: 'Order Pending Confirmation',
  ORDER_CONFIRMED: 'Order Confirmed',
  ORDER_SHIPPED: 'Order Shipped',
  ORDER_DELIVERED: 'Order Delivered',
  ORDER_CANCELLED: 'Order Cancelled',
};

/**
 * Descriptions for event types
 */
export const EVENT_TYPE_DESCRIPTIONS: Record<NotificationEventType, string> = {
  ORDER_PENDING_CONFIRMATION:
    'Sent when a customer places an order, asking them to confirm their details',
  ORDER_CONFIRMED: 'Sent when the seller confirms and accepts the order',
  ORDER_SHIPPED: 'Sent when the order is shipped with tracking information',
  ORDER_DELIVERED: 'Sent when the order has been delivered',
  ORDER_CANCELLED: 'Sent when the order is cancelled',
};
