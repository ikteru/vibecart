/**
 * CreateSellerFromInstagram Use Case
 *
 * Auto-creates a seller profile from Instagram profile data during login.
 * Generates shop name and handle from Instagram username.
 */

import { Seller } from '@/domain/entities/Seller';
import type { SellerRepository } from '@/domain/repositories/SellerRepository';
import type { InstagramConfig } from '@/domain/entities/Seller';

interface InstagramProfileData {
  username: string;
  id: string;
  followers_count?: number;
  profile_picture_url?: string;
}

interface CreateSellerFromInstagramInput {
  userId: string;
  instagramProfile: InstagramProfileData;
  tokenExpiresAt: string;
}

interface CreateSellerFromInstagramOutput {
  success: boolean;
  seller?: Seller;
  error?: string;
}

export class CreateSellerFromInstagram {
  constructor(private sellerRepository: SellerRepository) {}

  async execute(input: CreateSellerFromInstagramInput): Promise<CreateSellerFromInstagramOutput> {
    try {
      // Check if user already has a seller account
      const existing = await this.sellerRepository.findByUserId(input.userId);
      if (existing) {
        return { success: true, seller: existing };
      }

      const { username, id, followers_count, profile_picture_url } = input.instagramProfile;

      // Find available handle (username, then username_1, username_2, etc.)
      const handle = await this.findAvailableHandle(username);

      // Build Instagram config
      const instagramConfig: InstagramConfig = {
        isConnected: true,
        handle: username,
        userId: id,
        tokenExpiresAt: input.tokenExpiresAt,
        followersCount: followers_count,
        profilePictureUrl: profile_picture_url,
      };

      // Create seller with no WhatsApp (will be prompted later)
      const seller = Seller.create({
        userId: input.userId,
        shopName: username,
        handle,
        shopConfig: {
          instagram: instagramConfig,
        },
      });

      await this.sellerRepository.save(seller);

      return { success: true, seller };
    } catch (error) {
      console.error('CreateSellerFromInstagram error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create seller',
      };
    }
  }

  private async findAvailableHandle(username: string): Promise<string> {
    // Normalize: lowercase, only keep valid chars
    const base = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const normalizedBase = base.length >= 3 ? base : base.padEnd(3, '_');

    // Try the exact username first
    if (await this.sellerRepository.isHandleAvailable(normalizedBase)) {
      return normalizedBase;
    }

    // Try with numeric suffixes
    for (let i = 1; i <= 99; i++) {
      const candidate = `${normalizedBase}_${i}`;
      if (candidate.length <= 30 && await this.sellerRepository.isHandleAvailable(candidate)) {
        return candidate;
      }
    }

    // Fallback: use random suffix
    const randomSuffix = Math.random().toString(36).slice(2, 6);
    return `${normalizedBase.slice(0, 24)}_${randomSuffix}`;
  }
}
