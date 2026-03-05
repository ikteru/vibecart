/**
 * Seller Weslat Channel Repository Interface
 *
 * Maps sellers to their dedicated Weslat channels (for sellers who connected
 * their own WhatsApp Business number instead of using the shared VibeCart number).
 */

export interface SellerWeslatChannel {
  id: string;
  sellerId: string;
  weslatChannelId: string;
  weslatApiKeyEncrypted: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSellerWeslatChannelInput {
  sellerId: string;
  weslatChannelId: string;
  weslatApiKeyEncrypted: string;
}

export interface SellerWeslatChannelRepository {
  findBySellerId(sellerId: string): Promise<SellerWeslatChannel | null>;
  save(input: CreateSellerWeslatChannelInput): Promise<SellerWeslatChannel>;
  deactivate(sellerId: string): Promise<void>;
}
