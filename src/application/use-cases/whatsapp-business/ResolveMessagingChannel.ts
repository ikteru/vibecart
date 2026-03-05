/**
 * Resolve Messaging Channel Use Case
 *
 * Determines which WhatsApp channel to use for sending messages to a seller's customers:
 * - If seller has their own connected Weslat channel → use seller's channel
 * - Otherwise → use the shared VibeCart platform channel
 */

import { MessagingChannel } from '@/domain/value-objects/MessagingChannel';
import { decryptWhatsAppToken } from '@/infrastructure/utils/encryption';
import type { SellerWeslatChannelRepository } from '@/domain/repositories/SellerWeslatChannelRepository';

export class ResolveMessagingChannel {
  private sellerWeslatChannelRepository?: SellerWeslatChannelRepository;

  constructor(sellerWeslatChannelRepository?: SellerWeslatChannelRepository) {
    this.sellerWeslatChannelRepository = sellerWeslatChannelRepository;
  }

  async execute(sellerId: string): Promise<MessagingChannel> {
    // Check if seller has their own Weslat channel
    if (this.sellerWeslatChannelRepository) {
      const sellerChannel = await this.sellerWeslatChannelRepository.findBySellerId(sellerId);

      if (sellerChannel && sellerChannel.isActive) {
        try {
          const apiKey = decryptWhatsAppToken(sellerChannel.weslatApiKeyEncrypted);
          return MessagingChannel.seller(apiKey, sellerChannel.weslatChannelId);
        } catch {
          // Decryption failed — fall back to platform channel
          console.error(`Failed to decrypt Weslat API key for seller ${sellerId}, falling back to platform`);
        }
      }
    }

    // Default: use the shared VibeCart platform channel
    return MessagingChannel.platform();
  }
}
