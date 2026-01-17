/**
 * ActivityLog Entity
 *
 * Represents a logged activity/event in the system for audit trail.
 */

export type EntityType = 'product' | 'order' | 'settings' | 'seller';
export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'stock_updated'
  | 'activated'
  | 'deactivated';

export interface ActivityLogProps {
  id: string;
  sellerId: string;
  entityType: EntityType;
  entityId: string | null;
  action: ActivityAction;
  changes: Record<string, { old?: unknown; new?: unknown }>;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateActivityLogInput {
  sellerId: string;
  entityType: EntityType;
  entityId?: string;
  action: ActivityAction;
  changes?: Record<string, { old?: unknown; new?: unknown }>;
  metadata?: Record<string, unknown>;
}

export class ActivityLog {
  public readonly id: string;
  public readonly sellerId: string;
  public readonly entityType: EntityType;
  public readonly entityId: string | null;
  public readonly action: ActivityAction;
  public readonly changes: Record<string, { old?: unknown; new?: unknown }>;
  public readonly metadata: Record<string, unknown>;
  public readonly createdAt: Date;

  private constructor(props: ActivityLogProps) {
    this.id = props.id;
    this.sellerId = props.sellerId;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.action = props.action;
    this.changes = props.changes;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
  }

  /**
   * Create a new ActivityLog for insertion
   */
  static create(input: CreateActivityLogInput): ActivityLog {
    return new ActivityLog({
      id: crypto.randomUUID(),
      sellerId: input.sellerId,
      entityType: input.entityType,
      entityId: input.entityId || null,
      action: input.action,
      changes: input.changes || {},
      metadata: input.metadata || {},
      createdAt: new Date(),
    });
  }

  /**
   * Reconstitute from database
   */
  static fromPersistence(props: ActivityLogProps): ActivityLog {
    return new ActivityLog(props);
  }

  /**
   * Factory: Log product created
   */
  static productCreated(
    sellerId: string,
    productId: string,
    productTitle: string
  ): ActivityLog {
    return ActivityLog.create({
      sellerId,
      entityType: 'product',
      entityId: productId,
      action: 'created',
      metadata: { productTitle },
    });
  }

  /**
   * Factory: Log product updated
   */
  static productUpdated(
    sellerId: string,
    productId: string,
    productTitle: string,
    changes: Record<string, { old?: unknown; new?: unknown }>
  ): ActivityLog {
    return ActivityLog.create({
      sellerId,
      entityType: 'product',
      entityId: productId,
      action: 'updated',
      changes,
      metadata: { productTitle },
    });
  }

  /**
   * Factory: Log product deleted
   */
  static productDeleted(
    sellerId: string,
    productId: string,
    productTitle: string
  ): ActivityLog {
    return ActivityLog.create({
      sellerId,
      entityType: 'product',
      entityId: productId,
      action: 'deleted',
      metadata: { productTitle },
    });
  }

  /**
   * Factory: Log stock updated
   */
  static stockUpdated(
    sellerId: string,
    productId: string,
    productTitle: string,
    oldStock: number,
    newStock: number
  ): ActivityLog {
    return ActivityLog.create({
      sellerId,
      entityType: 'product',
      entityId: productId,
      action: 'stock_updated',
      changes: { stock: { old: oldStock, new: newStock } },
      metadata: { productTitle },
    });
  }

  /**
   * Factory: Log order status changed
   */
  static orderStatusChanged(
    sellerId: string,
    orderId: string,
    orderNumber: string,
    oldStatus: string,
    newStatus: string,
    customerName: string
  ): ActivityLog {
    return ActivityLog.create({
      sellerId,
      entityType: 'order',
      entityId: orderId,
      action: 'status_changed',
      changes: { status: { old: oldStatus, new: newStatus } },
      metadata: { orderNumber, customerName },
    });
  }

  /**
   * Factory: Log new order received
   */
  static orderReceived(
    sellerId: string,
    orderId: string,
    orderNumber: string,
    customerName: string,
    totalAmount: number
  ): ActivityLog {
    return ActivityLog.create({
      sellerId,
      entityType: 'order',
      entityId: orderId,
      action: 'created',
      metadata: { orderNumber, customerName, totalAmount },
    });
  }

  /**
   * Factory: Log settings updated
   */
  static settingsUpdated(
    sellerId: string,
    changes: Record<string, { old?: unknown; new?: unknown }>
  ): ActivityLog {
    return ActivityLog.create({
      sellerId,
      entityType: 'settings',
      action: 'updated',
      changes,
    });
  }

  /**
   * Get a human-readable description of this activity
   */
  getDescription(): string {
    switch (this.entityType) {
      case 'product':
        return this.getProductDescription();
      case 'order':
        return this.getOrderDescription();
      case 'settings':
        return 'Settings updated';
      default:
        return `${this.action} ${this.entityType}`;
    }
  }

  private getProductDescription(): string {
    const title = (this.metadata.productTitle as string) || 'Product';
    switch (this.action) {
      case 'created':
        return `Added "${title}"`;
      case 'updated':
        return `Updated "${title}"`;
      case 'deleted':
        return `Deleted "${title}"`;
      case 'stock_updated':
        const stockChange = this.changes.stock;
        if (stockChange) {
          return `Stock for "${title}" changed from ${stockChange.old} to ${stockChange.new}`;
        }
        return `Stock updated for "${title}"`;
      case 'activated':
        return `Activated "${title}"`;
      case 'deactivated':
        return `Deactivated "${title}"`;
      default:
        return `${this.action} "${title}"`;
    }
  }

  private getOrderDescription(): string {
    const orderNumber = (this.metadata.orderNumber as string) || 'Order';
    const customerName = (this.metadata.customerName as string) || '';
    switch (this.action) {
      case 'created':
        return `New order ${orderNumber} from ${customerName}`;
      case 'status_changed':
        const statusChange = this.changes.status;
        if (statusChange) {
          return `Order ${orderNumber}: ${statusChange.old} → ${statusChange.new}`;
        }
        return `Order ${orderNumber} status changed`;
      default:
        return `Order ${orderNumber} ${this.action}`;
    }
  }

  /**
   * Serialize for persistence
   */
  toPersistence(): ActivityLogProps {
    return {
      id: this.id,
      sellerId: this.sellerId,
      entityType: this.entityType,
      entityId: this.entityId,
      action: this.action,
      changes: this.changes,
      metadata: this.metadata,
      createdAt: this.createdAt,
    };
  }
}
