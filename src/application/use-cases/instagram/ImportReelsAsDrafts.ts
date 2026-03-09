/**
 * ImportReelsAsDrafts Use Case
 *
 * Fetches Instagram VIDEO media and creates draft products.
 * Skips media that's already been imported (by instagram_media_id).
 * Parses captions for price and category hints.
 */

import { Product } from '@/domain/entities/Product';
import type { ProductRepository } from '@/domain/repositories/ProductRepository';
import type { InstagramTokenRepository } from '@/domain/repositories/InstagramTokenRepository';
import { FetchInstagramMedia } from './FetchInstagramMedia';
import type { InstagramMediaDTO } from '@/application/dtos/InstagramDTO';
import type { ProductCategoryType } from '@/domain/value-objects/ProductCategory';
import { logger } from '@/infrastructure/utils/logger';

interface ImportReelsAsDraftsInput {
  sellerId: string;
  limit?: number;
}

interface DraftProduct {
  id: string;
  title: string;
  price: number;
  category: ProductCategoryType;
  videoUrl: string;
  instagramMediaId: string;
}

interface ImportReelsAsDraftsOutput {
  success: boolean;
  imported: number;
  drafts: DraftProduct[];
  error?: string;
}

// Price patterns: "100 dh", "50 MAD", "200درهم", "150 DH"
const PRICE_REGEX = /(\d+(?:[.,]\d+)?)\s*(?:dh|mad|درهم|dirhams?)/i;

// Category keyword mapping
const CATEGORY_KEYWORDS: Record<string, ProductCategoryType> = {
  // English
  dress: 'clothing', shirt: 'clothing', pants: 'clothing', jacket: 'clothing',
  tshirt: 'clothing', hoodie: 'clothing', abaya: 'clothing', caftan: 'clothing',
  shoes: 'shoes', sneakers: 'shoes', boots: 'shoes', sandals: 'shoes',
  heels: 'shoes', basket: 'shoes',
  ring: 'jewelry', necklace: 'jewelry', bracelet: 'jewelry', earring: 'jewelry',
  lipstick: 'beauty', makeup: 'beauty', skincare: 'beauty', parfum: 'beauty',
  perfume: 'beauty', cream: 'beauty',
  // French
  robe: 'clothing', chemise: 'clothing', pantalon: 'clothing', veste: 'clothing',
  chaussure: 'shoes', bijoux: 'jewelry', collier: 'jewelry', bague: 'jewelry',
  maquillage: 'beauty', crème: 'beauty',
  // Arabic/Darija
  'قفطان': 'clothing', 'جلابة': 'clothing', 'حذاء': 'shoes', 'خاتم': 'jewelry',
  'سلسلة': 'jewelry', 'عطر': 'beauty', 'كريم': 'beauty',
};

function parseCaption(caption?: string): { title: string; price: number; category: ProductCategoryType } {
  const defaultResult = { title: 'Untitled', price: 100, category: 'other' as ProductCategoryType };

  if (!caption) return defaultResult;

  // Extract title from first line
  const firstLine = caption.split('\n')[0].trim();
  const title = firstLine.length > 0 && firstLine.length <= 100
    ? firstLine.replace(/[#@].*$/, '').trim() || 'Untitled'
    : 'Untitled';

  // Extract price
  let price = 100; // 1 MAD placeholder
  const priceMatch = caption.match(PRICE_REGEX);
  if (priceMatch) {
    const parsed = parseFloat(priceMatch[1].replace(',', '.'));
    if (parsed > 0 && parsed < 100000) {
      price = Math.round(parsed * 100); // Convert to centimes
    }
  }

  // Detect category from keywords
  let category: ProductCategoryType = 'other';
  const lowerCaption = caption.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lowerCaption.includes(keyword.toLowerCase())) {
      category = cat;
      break;
    }
  }

  return { title, price, category };
}

export class ImportReelsAsDrafts {
  constructor(
    private instagramTokenRepository: InstagramTokenRepository,
    private productRepository: ProductRepository,
  ) {}

  async execute(input: ImportReelsAsDraftsInput): Promise<ImportReelsAsDraftsOutput> {
    try {
      // 1. Fetch Instagram media
      const fetchMedia = new FetchInstagramMedia(this.instagramTokenRepository);
      const mediaResult = await fetchMedia.execute({
        sellerId: input.sellerId,
        limit: input.limit || 20,
      });

      if (!mediaResult.success || !mediaResult.data) {
        return {
          success: false,
          imported: 0,
          drafts: [],
          error: mediaResult.error || 'Failed to fetch Instagram media',
        };
      }

      // 2. Filter to VIDEO only
      const videos = mediaResult.data.media.filter(
        (m: InstagramMediaDTO) => m.mediaType === 'VIDEO' && m.mediaUrl
      );

      // 3. Create draft products, skipping already-imported
      const drafts: DraftProduct[] = [];

      for (const video of videos) {
        // Check if already imported
        const existing = await this.productRepository.findByInstagramMediaId(video.id);
        if (existing) continue;

        const { title, price, category } = parseCaption(video.caption);

        const product = Product.create({
          sellerId: input.sellerId,
          title,
          description: video.caption || '',
          price,
          stock: 0,
          videoUrl: video.mediaUrl!,
          instagramMediaId: video.id,
          category,
        });

        // Deactivate — this is a draft
        product.deactivate();

        await this.productRepository.save(product);

        drafts.push({
          id: product.id,
          title: product.title,
          price: product.price.amount,
          category: product.category.value,
          videoUrl: video.mediaUrl!,
          instagramMediaId: video.id,
        });
      }

      return {
        success: true,
        imported: drafts.length,
        drafts,
      };
    } catch (error) {
      logger.error('ImportReelsAsDrafts error', { context: 'instagram-import', sellerId: input.sellerId, error: error instanceof Error ? error.message : 'Unknown' });
      return {
        success: false,
        imported: 0,
        drafts: [],
        error: error instanceof Error ? error.message : 'Failed to import reels',
      };
    }
  }
}
