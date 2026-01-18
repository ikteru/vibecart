/**
 * WhatsApp Message Template Entity
 *
 * Represents a reusable message template that can be submitted to Meta
 * for approval and used to send notifications to customers.
 *
 * Templates follow Meta's Business API format with components for
 * HEADER, BODY, FOOTER, and BUTTONS.
 */

export type TemplateCategory = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
export type TemplateStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type TemplateLanguage = 'ar' | 'en' | 'fr';

export type TemplateComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
export type HeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
export type ButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';

export interface TemplateButton {
  type: ButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
}

export interface TemplateComponent {
  type: TemplateComponentType;
  format?: HeaderFormat;
  text?: string;
  buttons?: TemplateButton[];
  example?: {
    header_text?: string[];
    body_text?: string[][];
  };
}

export interface WhatsAppMessageTemplateProps {
  id: string;
  sellerId: string;
  metaTemplateId?: string;
  templateName: string;
  templateLanguage: TemplateLanguage;
  category: TemplateCategory;
  status: TemplateStatus;
  rejectionReason?: string;
  description?: string;
  components: TemplateComponent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateInput {
  sellerId: string;
  templateName: string;
  templateLanguage?: TemplateLanguage;
  category: TemplateCategory;
  description?: string;
  components: TemplateComponent[];
}

export interface UpdateTemplateInput {
  templateName?: string;
  templateLanguage?: TemplateLanguage;
  category?: TemplateCategory;
  description?: string;
  components?: TemplateComponent[];
}

export class WhatsAppMessageTemplate {
  public readonly id: string;
  public readonly sellerId: string;
  private _metaTemplateId?: string;
  private _templateName: string;
  private _templateLanguage: TemplateLanguage;
  private _category: TemplateCategory;
  private _status: TemplateStatus;
  private _rejectionReason?: string;
  private _description?: string;
  private _components: TemplateComponent[];
  public readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: WhatsAppMessageTemplateProps) {
    this.id = props.id;
    this.sellerId = props.sellerId;
    this._metaTemplateId = props.metaTemplateId;
    this._templateName = props.templateName;
    this._templateLanguage = props.templateLanguage;
    this._category = props.category;
    this._status = props.status;
    this._rejectionReason = props.rejectionReason;
    this._description = props.description;
    this._components = props.components;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Create a new template in DRAFT status
   */
  static create(input: CreateTemplateInput): WhatsAppMessageTemplate {
    const now = new Date();

    if (!input.sellerId) {
      throw new Error('Seller ID is required');
    }

    if (!input.templateName) {
      throw new Error('Template name is required');
    }

    // Template names must be lowercase with underscores only (Meta requirement)
    const normalizedName = input.templateName.toLowerCase().replace(/\s+/g, '_');
    if (!/^[a-z][a-z0-9_]*$/.test(normalizedName)) {
      throw new Error(
        'Template name must start with a letter and contain only lowercase letters, numbers, and underscores'
      );
    }

    if (!input.components || input.components.length === 0) {
      throw new Error('At least one component is required');
    }

    // Validate components
    const hasBody = input.components.some((c) => c.type === 'BODY');
    if (!hasBody) {
      throw new Error('Template must have a BODY component');
    }

    return new WhatsAppMessageTemplate({
      id: crypto.randomUUID(),
      sellerId: input.sellerId,
      templateName: normalizedName,
      templateLanguage: input.templateLanguage || 'ar',
      category: input.category,
      status: 'DRAFT',
      description: input.description,
      components: input.components,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from database
   */
  static fromPersistence(props: WhatsAppMessageTemplateProps): WhatsAppMessageTemplate {
    return new WhatsAppMessageTemplate(props);
  }

  // Getters
  get metaTemplateId(): string | undefined {
    return this._metaTemplateId;
  }

  get templateName(): string {
    return this._templateName;
  }

  get templateLanguage(): TemplateLanguage {
    return this._templateLanguage;
  }

  get category(): TemplateCategory {
    return this._category;
  }

  get status(): TemplateStatus {
    return this._status;
  }

  get rejectionReason(): string | undefined {
    return this._rejectionReason;
  }

  get description(): string | undefined {
    return this._description;
  }

  get components(): TemplateComponent[] {
    return [...this._components];
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Check if template can be edited (only DRAFT or REJECTED)
   */
  canEdit(): boolean {
    return this._status === 'DRAFT' || this._status === 'REJECTED';
  }

  /**
   * Check if template can be submitted to Meta
   */
  canSubmit(): boolean {
    return this._status === 'DRAFT' || this._status === 'REJECTED';
  }

  /**
   * Check if template can be used for sending messages
   */
  canUse(): boolean {
    return this._status === 'APPROVED';
  }

  /**
   * Update template details (only if DRAFT or REJECTED)
   */
  update(input: UpdateTemplateInput): void {
    if (!this.canEdit()) {
      throw new Error(`Cannot edit template in ${this._status} status`);
    }

    if (input.templateName !== undefined) {
      const normalizedName = input.templateName.toLowerCase().replace(/\s+/g, '_');
      if (!/^[a-z][a-z0-9_]*$/.test(normalizedName)) {
        throw new Error(
          'Template name must start with a letter and contain only lowercase letters, numbers, and underscores'
        );
      }
      this._templateName = normalizedName;
    }

    if (input.templateLanguage !== undefined) {
      this._templateLanguage = input.templateLanguage;
    }

    if (input.category !== undefined) {
      this._category = input.category;
    }

    if (input.description !== undefined) {
      this._description = input.description;
    }

    if (input.components !== undefined) {
      const hasBody = input.components.some((c) => c.type === 'BODY');
      if (!hasBody) {
        throw new Error('Template must have a BODY component');
      }
      this._components = input.components;
    }

    // Reset rejection reason when editing a rejected template
    if (this._status === 'REJECTED') {
      this._rejectionReason = undefined;
      this._status = 'DRAFT';
    }

    this._updatedAt = new Date();
  }

  /**
   * Mark template as submitted to Meta
   */
  markAsSubmitted(): void {
    if (!this.canSubmit()) {
      throw new Error(`Cannot submit template in ${this._status} status`);
    }
    this._status = 'PENDING';
    this._rejectionReason = undefined;
    this._updatedAt = new Date();
  }

  /**
   * Mark template as approved by Meta
   */
  markAsApproved(metaTemplateId: string): void {
    if (this._status !== 'PENDING') {
      throw new Error(`Cannot approve template in ${this._status} status`);
    }
    this._status = 'APPROVED';
    this._metaTemplateId = metaTemplateId;
    this._rejectionReason = undefined;
    this._updatedAt = new Date();
  }

  /**
   * Mark template as rejected by Meta
   */
  markAsRejected(reason?: string): void {
    if (this._status !== 'PENDING') {
      throw new Error(`Cannot reject template in ${this._status} status`);
    }
    this._status = 'REJECTED';
    this._rejectionReason = reason;
    this._updatedAt = new Date();
  }

  /**
   * Get the body text (for preview)
   */
  getBodyText(): string {
    const bodyComponent = this._components.find((c) => c.type === 'BODY');
    return bodyComponent?.text || '';
  }

  /**
   * Get header text (if exists)
   */
  getHeaderText(): string | undefined {
    const headerComponent = this._components.find((c) => c.type === 'HEADER');
    return headerComponent?.format === 'TEXT' ? headerComponent.text : undefined;
  }

  /**
   * Extract variable placeholders from template
   * Returns array like ['1', '2', '3'] for {{1}}, {{2}}, {{3}}
   */
  getVariables(): string[] {
    const variables = new Set<string>();
    const pattern = /\{\{(\d+)\}\}/g;

    for (const component of this._components) {
      if (component.text) {
        let match;
        while ((match = pattern.exec(component.text)) !== null) {
          variables.add(match[1]);
        }
      }
    }

    return Array.from(variables).sort((a, b) => parseInt(a) - parseInt(b));
  }

  /**
   * Convert to Meta API format for template creation
   */
  toMetaApiFormat(): {
    name: string;
    language: string;
    category: string;
    components: Array<{
      type: string;
      format?: string;
      text?: string;
      buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>;
      example?: Record<string, unknown>;
    }>;
  } {
    return {
      name: this._templateName,
      language: this._templateLanguage,
      category: this._category,
      components: this._components.map((component) => {
        const metaComponent: {
          type: string;
          format?: string;
          text?: string;
          buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>;
          example?: Record<string, unknown>;
        } = {
          type: component.type,
        };

        if (component.format) {
          metaComponent.format = component.format;
        }

        if (component.text) {
          metaComponent.text = component.text;
        }

        if (component.buttons) {
          metaComponent.buttons = component.buttons.map((btn) => ({
            type: btn.type,
            text: btn.text,
            ...(btn.url && { url: btn.url }),
            ...(btn.phoneNumber && { phone_number: btn.phoneNumber }),
          }));
        }

        if (component.example) {
          metaComponent.example = component.example;
        }

        return metaComponent;
      }),
    };
  }

  /**
   * Serialize for persistence
   */
  toPersistence(): WhatsAppMessageTemplateProps {
    return {
      id: this.id,
      sellerId: this.sellerId,
      metaTemplateId: this._metaTemplateId,
      templateName: this._templateName,
      templateLanguage: this._templateLanguage,
      category: this._category,
      status: this._status,
      rejectionReason: this._rejectionReason,
      description: this._description,
      components: this._components,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
