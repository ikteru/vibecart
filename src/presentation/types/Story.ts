/**
 * Story types for Instagram-style story circles and viewer
 */

import type { Product } from '@/domain/entities/Product';

export interface SpotlightStoryData {
  title: string;
  subtitle: string;
  color: string;
}

export interface MakerBioStoryData {
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
}

export interface ReviewStoryData {
  imageUrl: string;
  rating?: number;
  text?: string;
  username?: string;
}

export interface ChatReviewStoryData {
  imageUrl: string;
  customerName?: string;
  platform?: string;
}

export interface ProductStoryData {
  product: Product;
}

export type StoryItem =
  | { type: 'spotlight'; data: SpotlightStoryData }
  | { type: 'makerBio'; data: MakerBioStoryData }
  | { type: 'review'; data: ReviewStoryData }
  | { type: 'chatReview'; data: ChatReviewStoryData }
  | { type: 'product'; data: ProductStoryData };

export interface StoryGroup {
  id: string;
  label: string;
  thumbnail: string; // URL or CSS class for gradient
  thumbnailType: 'image' | 'gradient' | 'letter';
  items: StoryItem[];
}
