'use client';

import React, { useState, useMemo } from 'react';
import { SellerProfile } from '@/presentation/components/seller/SellerProfile';
import { VideoFeed } from '@/presentation/components/video/VideoFeed';
import { Product } from '@/domain/entities/Product';
import { Money } from '@/domain/value-objects/Money';
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
    price: Money.create(dto.price.amount, dto.price.currency as 'MAD' | 'USD' | 'EUR'),
    discountPrice: dto.discountPrice
      ? Money.create(dto.discountPrice.amount, dto.discountPrice.currency as 'MAD' | 'USD' | 'EUR')
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

  // Build shop config from seller data
  const shopConfig = useMemo(() => {
    return {
      // Google Maps (disabled by default, can be configured via seller dashboard)
      googleMaps: {
        enabled: false,
        rating: 0,
        reviews: 0,
        placeName: '',
      },
      // Spotlight (disabled by default, can be configured via seller dashboard)
      spotlight: {
        enabled: false,
        title: '',
        subtitle: '',
        color: 'from-zinc-500 to-zinc-600',
      },
      // Maker bio (disabled by default)
      makerBio: {
        enabled: false,
        name: '',
        role: '',
        bio: '',
        imageUrl: '',
      },
      // Reviews (future feature)
      reviews: [],
      // WhatsApp
      whatsapp: {
        businessNumber: seller.whatsappUrl,
      },
      // Shipping (default rates, can be customized)
      shipping: {
        defaultRate: 35,
        rules: [
          { city: 'Casablanca', rate: 25 },
          { city: 'Marrakech', rate: 0 },
          { city: 'Rabat', rate: 30 },
        ],
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
        initialVideoId={selectedProductId || undefined}
        onBack={handleBackFromFeed}
        shopConfig={{
          shipping: shopConfig.shipping,
        }}
      />
    </div>
  );
}
