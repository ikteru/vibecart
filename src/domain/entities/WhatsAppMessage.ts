/**
 * WhatsApp Message Entity
 *
 * Represents a WhatsApp message sent to a customer.
 * Tracks delivery status for monitoring and debugging.
 */

export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
export type MessageType = 'template' | 'text' | 'interactive';

export interface WhatsAppMessageProps {
  id: string;
  sellerId: string;
  orderId?: string;
  whatsappMessageId?: string;
  recipientPhone: string;
  templateName?: string;
  messageType: MessageType;
  messageContent: Record<string, unknown>;
  status: MessageStatus;
  errorCode?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export interface CreateWhatsAppMessageInput {
  sellerId: string;
  orderId?: string;
  recipientPhone: string;
  templateName?: string;
  messageType: MessageType;
  messageContent: Record<string, unknown>;
}

export class WhatsAppMessage {
  public readonly id: string;
  public readonly sellerId: string;
  public readonly orderId?: string;
  private _whatsappMessageId?: string;
  public readonly recipientPhone: string;
  public readonly templateName?: string;
  public readonly messageType: MessageType;
  public readonly messageContent: Record<string, unknown>;
  private _status: MessageStatus;
  private _errorCode?: string;
  private _errorMessage?: string;
  private _sentAt?: Date;
  private _deliveredAt?: Date;
  private _readAt?: Date;
  public readonly createdAt: Date;

  private constructor(props: WhatsAppMessageProps) {
    this.id = props.id;
    this.sellerId = props.sellerId;
    this.orderId = props.orderId;
    this._whatsappMessageId = props.whatsappMessageId;
    this.recipientPhone = props.recipientPhone;
    this.templateName = props.templateName;
    this.messageType = props.messageType;
    this.messageContent = props.messageContent;
    this._status = props.status;
    this._errorCode = props.errorCode;
    this._errorMessage = props.errorMessage;
    this._sentAt = props.sentAt;
    this._deliveredAt = props.deliveredAt;
    this._readAt = props.readAt;
    this.createdAt = props.createdAt;
  }

  /**
   * Create a new WhatsApp message record
   */
  static create(input: CreateWhatsAppMessageInput): WhatsAppMessage {
    const now = new Date();

    if (!input.sellerId) {
      throw new Error('Seller ID is required');
    }

    if (!input.recipientPhone) {
      throw new Error('Recipient phone is required');
    }

    return new WhatsAppMessage({
      id: crypto.randomUUID(),
      sellerId: input.sellerId,
      orderId: input.orderId,
      recipientPhone: input.recipientPhone,
      templateName: input.templateName,
      messageType: input.messageType,
      messageContent: input.messageContent,
      status: 'PENDING',
      createdAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  static fromPersistence(props: WhatsAppMessageProps): WhatsAppMessage {
    return new WhatsAppMessage(props);
  }

  // Getters
  get whatsappMessageId(): string | undefined {
    return this._whatsappMessageId;
  }

  get status(): MessageStatus {
    return this._status;
  }

  get errorCode(): string | undefined {
    return this._errorCode;
  }

  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  get sentAt(): Date | undefined {
    return this._sentAt;
  }

  get deliveredAt(): Date | undefined {
    return this._deliveredAt;
  }

  get readAt(): Date | undefined {
    return this._readAt;
  }

  /**
   * Mark message as sent
   */
  markAsSent(whatsappMessageId: string): void {
    this._whatsappMessageId = whatsappMessageId;
    this._status = 'SENT';
    this._sentAt = new Date();
  }

  /**
   * Mark message as delivered
   */
  markAsDelivered(): void {
    this._status = 'DELIVERED';
    this._deliveredAt = new Date();
  }

  /**
   * Mark message as read
   */
  markAsRead(): void {
    this._status = 'READ';
    this._readAt = new Date();
  }

  /**
   * Mark message as failed
   */
  markAsFailed(errorCode?: string, errorMessage?: string): void {
    this._status = 'FAILED';
    this._errorCode = errorCode;
    this._errorMessage = errorMessage;
  }

  /**
   * Check if message was successfully sent
   */
  wasSent(): boolean {
    return this._status !== 'PENDING' && this._status !== 'FAILED';
  }

  /**
   * Check if message was delivered
   */
  wasDelivered(): boolean {
    return this._status === 'DELIVERED' || this._status === 'READ';
  }

  /**
   * Serialize for persistence
   */
  toPersistence(): WhatsAppMessageProps {
    return {
      id: this.id,
      sellerId: this.sellerId,
      orderId: this.orderId,
      whatsappMessageId: this._whatsappMessageId,
      recipientPhone: this.recipientPhone,
      templateName: this.templateName,
      messageType: this.messageType,
      messageContent: this.messageContent,
      status: this._status,
      errorCode: this._errorCode,
      errorMessage: this._errorMessage,
      sentAt: this._sentAt,
      deliveredAt: this._deliveredAt,
      readAt: this._readAt,
      createdAt: this.createdAt,
    };
  }
}
