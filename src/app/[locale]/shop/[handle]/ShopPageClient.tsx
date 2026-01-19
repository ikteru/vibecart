'use client';

import React, { useState, useMemo } from 'react';
import { SellerProfile } from '@/presentation/components/seller/SellerProfile';
import { VideoFeed } from '@/presentation/components/video/VideoFeed';
import { Product } from '@/domain/entities/Product';
import { Money, type Currency } from '@/domain/value-objects/Money';
import { ProductCategory } from '@/domain/value-objects/ProductCategory';
import type { ProductResponseDTO } from '@/application/dtos/ProductDTO';
import type { PublicSellerDTO } from '@/application/dtos/SellerDTO';

interface ShopPageClientProps {
  seller: PublicSellerDTO;
  products: ProductResponseDTO[];
}

type View = 'profile' | 'feed' | 'checkout';

/**
 * Convert ProductResponseDTO to Product domain entity for UI components
 */
function dtoToProduct(dto: ProductResponseDTO): Product {
  return Product.fromPersistence({
    id: dto.id,
    sellerId: dto.sellerId,
    title: dto.title,
    description: dto.description,
    price: Money.create(dto.price.amount, dto.price.currency as Currency),
    discountPrice: dto.discountPrice
      ? Money.create(dto.discountPrice.amount, dto.discountPrice.currency as Currency)
      : undefined,
    promotionLabel: dto.promotionLabel || undefined,
    stock: dto.stock,
    videoUrl: dto.videoUrl || undefined,
    instagramMediaId: dto.instagramMediaId || undefined,
    category: ProductCategory.create(dto.category),
    variants: dto.variants,
    isActive: dto.isActive,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  });
}

/**
 * ShopPageClient
 *
 * Client component for shop page interactivity.
 */
export function ShopPageClient({ seller, products: productDTOs }: ShopPageClientProps) {
  // Convert DTOs to domain entities for UI components
  const products = useMemo(
    () => productDTOs.map(dtoToProduct),
    [productDTOs]
  );

  const [view, setView] = useState<View>('profile');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Build shop config from real seller data
  const shopConfig = useMemo(() => {
    const vibe = seller.shopConfig?.vibe;
    const googleMaps = seller.shopConfig?.googleMaps;
    const shipping = seller.shopConfig?.shipping;

    return {
      // Google Maps from seller config
      googleMaps: {
        enabled: googleMaps?.enabled || false,
        rating: googleMaps?.rating || 0,
        reviews: googleMaps?.reviews || 0,
        placeName: googleMaps?.placeName || '',
      },
      // Spotlight from vibe config
      spotlight: {
        enabled: vibe?.spotlight?.enabled || false,
        title: vibe?.spotlight?.title || '',
        subtitle: vibe?.spotlight?.subtitle || '',
        color: vibe?.spotlight?.color || 'from-zinc-500 to-zinc-600',
      },
      // Maker bio from vibe config
      makerBio: {
        enabled: vibe?.makerBio?.enabled || false,
        name: vibe?.makerBio?.name || '',
        role: vibe?.makerBio?.role || '',
        bio: vibe?.makerBio?.bio || '',
        imageUrl: vibe?.makerBio?.imageUrl || '',
      },
      // Pinned reviews from vibe config
      reviews: (vibe?.pinnedReviews || []).map((review) => ({
        ...review,
        enabled: true,
      })),
      // Chat reviews from vibe config
      chatReviews: vibe?.chatReviews || [],
      // WhatsApp
      whatsapp: {
        businessNumber: seller.whatsappUrl,
      },
      // Shipping from seller config with defaults
      shipping: {
        defaultRate: shipping?.defaultRate || 35,
        freeShippingThreshold: shipping?.freeShippingThreshold,
        rules: shipping?.rules || [],
      },
    };
  }, [seller]);

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setView('feed');
  };

  const handleBackFromFeed = () => {
    setView('profile');
    setSelectedProductId(null);
  };

  // Profile view
  if (view === 'profile') {
    return (
      <div className="h-screen">
        <SellerProfile
          sellerName={seller.shopName}
          sellerHandle={seller.handle}
          products={products}
          shopConfig={shopConfig}
          onBack={() => window.history.back()}
          onSelectProduct={handleSelectProduct}
        />
      </div>
    );
  }

  // Video feed view
  return (
    <div className="h-screen">
      <VideoFeed
        products={products}
        sellerId={seller.id}
        initialVideoId={selectedProductId || undefined}
        onBack={handleBackFromFeed}
        shopConfig={{
          shipping: shopConfig.shipping,
        }}
      />
    </div>
  );
}
