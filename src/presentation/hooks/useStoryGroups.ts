'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { Product } from '@/domain/entities/Product';
import type { StoryGroup, StoryItem } from '@/presentation/types/Story';

interface ShopVibeConfig {
  spotlight: {
    enabled: boolean;
    title: string;
    subtitle: string;
    color: string;
  };
  makerBio: {
    enabled: boolean;
    name: string;
    role: string;
    bio: string;
    imageUrl: string;
  };
  reviews: Array<{
    id: string;
    image: string;
    note: string;
    username: string;
    enabled?: boolean;
  }>;
  chatReviews: Array<{
    id: string;
    screenshotUrl: string;
    customerName: string;
    platform: string;
  }>;
}

export function useStoryGroups(vibeConfig: ShopVibeConfig, products: Product[]) {
  const t = useTranslations('customer.stories');

  return useMemo(() => {
    const groups: StoryGroup[] = [];

    // Spotlight story
    if (vibeConfig.spotlight.enabled && vibeConfig.spotlight.title) {
      groups.push({
        id: 'spotlight',
        label: t('spotlight'),
        thumbnail: vibeConfig.spotlight.color || 'from-emerald-500 to-teal-600',
        thumbnailType: 'gradient',
        items: [
          {
            type: 'spotlight',
            data: {
              title: vibeConfig.spotlight.title,
              subtitle: vibeConfig.spotlight.subtitle,
              color: vibeConfig.spotlight.color,
            },
          },
        ],
      });
    }

    // Maker Bio story
    if (vibeConfig.makerBio.enabled && vibeConfig.makerBio.name) {
      groups.push({
        id: 'maker-bio',
        label: t('about'),
        thumbnail: vibeConfig.makerBio.imageUrl || '',
        thumbnailType: vibeConfig.makerBio.imageUrl ? 'image' : 'letter',
        items: [
          {
            type: 'makerBio',
            data: {
              name: vibeConfig.makerBio.name,
              role: vibeConfig.makerBio.role,
              bio: vibeConfig.makerBio.bio,
              imageUrl: vibeConfig.makerBio.imageUrl,
            },
          },
        ],
      });
    }

    // Pinned Reviews story (multiple items in one group)
    const enabledReviews = vibeConfig.reviews.filter((r) => r.enabled !== false && r.image);
    if (enabledReviews.length > 0) {
      const reviewItems: StoryItem[] = enabledReviews.map((review) => ({
        type: 'review' as const,
        data: {
          imageUrl: review.image,
          text: review.note,
          username: review.username,
        },
      }));

      groups.push({
        id: 'reviews',
        label: t('reviews'),
        thumbnail: enabledReviews[0].image,
        thumbnailType: 'image',
        items: reviewItems,
      });
    }

    // Chat Reviews story (multiple items in one group)
    const validChatReviews = vibeConfig.chatReviews.filter((c) => c.screenshotUrl);
    if (validChatReviews.length > 0) {
      const chatItems: StoryItem[] = validChatReviews.map((chat) => ({
        type: 'chatReview' as const,
        data: {
          imageUrl: chat.screenshotUrl,
          customerName: chat.customerName,
          platform: chat.platform,
        },
      }));

      groups.push({
        id: 'chat-reviews',
        label: t('chat'),
        thumbnail: validChatReviews[0].screenshotUrl,
        thumbnailType: 'image',
        items: chatItems,
      });
    }

    // Featured products (first 5)
    const featuredProducts = products.slice(0, 5);
    featuredProducts.forEach((product) => {
      groups.push({
        id: `product-${product.id}`,
        label: product.title.length > 10 ? product.title.slice(0, 10) + '…' : product.title,
        thumbnail: product.videoUrl || '',
        thumbnailType: product.videoUrl ? 'image' : 'letter',
        items: [
          {
            type: 'product',
            data: { product },
          },
        ],
      });
    });

    return groups;
  }, [vibeConfig, products, t]);
}
