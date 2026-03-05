/**
 * Messaging Channel Value Object
 *
 * Represents the WhatsApp channel used to send messages to a seller's customers.
 * Either the shared VibeCart platform number or the seller's own WhatsApp Business number.
 */

export type MessagingChannelType = 'platform' | 'seller';

export interface MessagingChannelProps {
  type: MessagingChannelType;
  weslatApiKey: string;
  weslatChannelId?: string;
}

export class MessagingChannel {
  public readonly type: MessagingChannelType;
  public readonly weslatApiKey: string;
  public readonly weslatChannelId?: string;

  private constructor(props: MessagingChannelProps) {
    this.type = props.type;
    this.weslatApiKey = props.weslatApiKey;
    this.weslatChannelId = props.weslatChannelId;
  }

  /**
   * Create the platform (shared VibeCart number) channel
   */
  static platform(): MessagingChannel {
    const apiKey = process.env.WESLAT_PLATFORM_API_KEY;
    if (!apiKey) {
      throw new Error('WESLAT_PLATFORM_API_KEY is not configured');
    }
    return new MessagingChannel({
      type: 'platform',
      weslatApiKey: apiKey,
    });
  }

  /**
   * Create a seller-owned channel
   */
  static seller(weslatApiKey: string, weslatChannelId: string): MessagingChannel {
    return new MessagingChannel({
      type: 'seller',
      weslatApiKey,
      weslatChannelId,
    });
  }

  isPlatform(): boolean {
    return this.type === 'platform';
  }

  isSeller(): boolean {
    return this.type === 'seller';
  }
}
