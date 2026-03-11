'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { VideoFeed } from '@/presentation/components/video/VideoFeed';
import { CustomerNav, type CustomerTab } from '@/presentation/components/customer/CustomerNav';
import { CustomerFeed } from '@/presentation/components/customer/CustomerFeed';
import { SavedProducts } from '@/presentation/components/customer/SavedProducts';
import { CustomerOrders } from '@/presentation/components/customer/CustomerOrders';
import { Product } from '@/domain/entities/Product';
import { Money, type Currency } from '@/domain/value-objects/Money';
import { ProductCategory } from '@/domain/value-objects/ProductCategory';
import { useSaved } from '@/presentation/hooks/useSaved';
import { useCustomerOrders } from '@/presentation/hooks/useCustomerOrders';
import type { ProductResponseDTO } from '@/application/dtos/ProductDTO';
import type { PublicSellerDTO } from '@/application/dtos/SellerDTO';

interface ShopPageClientProps {
  seller: PublicSellerDTO;
  products: ProductResponseDTO[];
}

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
 * Client component for the customer shop experience with tabbed navigation.
 */
export function ShopPageClient({ seller, products: productDTOs }: ShopPageClientProps) {
  const locale = useLocale();
  const products = useMemo(
    () => productDTOs.map(dtoToProduct),
    [productDTOs]
  );

  const [activeTab, setActiveTab] = useState<CustomerTab>('feed');
  const [showVideoFeed, setShowVideoFeed] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Hooks for local customer data
  const saved = useSaved(seller.handle);
  const customerOrders = useCustomerOrders(seller.handle, activeTab === 'orders');

  // Build shop config from seller data
  const shopConfig = useMemo(() => {
    const vibe = seller.shopConfig?.vibe;
    const googleMaps = seller.shopConfig?.googleMaps;
    const shipping = seller.shopConfig?.shipping;
    const pickup = seller.shopConfig?.pickup;

    return {
      googleMaps: {
        enabled: googleMaps?.enabled || false,
        rating: googleMaps?.rating || 0,
        reviews: googleMaps?.reviews || 0,
        placeName: googleMaps?.placeName || '',
      },
      spotlight: {
        enabled: vibe?.spotlight?.enabled || false,
        title: vibe?.spotlight?.title || '',
        subtitle: vibe?.spotlight?.subtitle || '',
        color: vibe?.spotlight?.color || 'from-zinc-500 to-zinc-600',
      },
      makerBio: {
        enabled: vibe?.makerBio?.enabled || false,
        name: vibe?.makerBio?.name || '',
        role: vibe?.makerBio?.role || '',
        bio: vibe?.makerBio?.bio || '',
        imageUrl: vibe?.makerBio?.imageUrl || '',
      },
      reviews: (vibe?.pinnedReviews || []).map((review) => ({
        ...review,
        enabled: true,
      })),
      chatReviews: vibe?.chatReviews || [],
      whatsapp: {
        businessNumber: seller.whatsappUrl,
      },
      shipping: {
        defaultRate: shipping?.defaultRate || 35,
        freeShippingThreshold: shipping?.freeShippingThreshold,
        rules: shipping?.rules || [],
      },
      pickup: pickup,
    };
  }, [seller]);

  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProductId(productId);
    setShowVideoFeed(true);
  }, []);

  const handleBackFromFeed = useCallback(() => {
    setShowVideoFeed(false);
    setSelectedProductId(null);
  }, []);

  const handleToggleSaved = useCallback(
    (product: Product) => {
      saved.toggleSaved({
        productId: product.id,
        title: product.title,
        price: product.price.amount,
        currency: product.price.currency,
        discountPrice: product.discountPrice?.amount,
        thumbnail: product.videoUrl || undefined,
      });
    },
    [saved]
  );

  // Full-screen video feed view
  if (showVideoFeed) {
    return (
      <div className="h-screen">
        <VideoFeed
          products={products}
          sellerId={seller.id}
          initialVideoId={selectedProductId || undefined}
          onBack={handleBackFromFeed}
          shopConfig={{
            shipping: shopConfig.shipping,
            pickup: shopConfig.pickup,
          }}
          sellerName={seller.shopName}
          sellerHandle={seller.handle}
          onOrderSuccess={customerOrders.addOrder}
        />
      </div>
    );
  }

  // Tabbed customer experience
  return (
    <div className="h-screen bg-black">
      {activeTab === 'feed' && (
        <CustomerFeed
          sellerName={seller.shopName}
          sellerHandle={seller.handle}
          products={products}
          shopConfig={shopConfig}
          onSelectProduct={handleSelectProduct}
          isSaved={saved.isSaved}
          onToggleSaved={handleToggleSaved}
          hasOrderUpdates={customerOrders.hasUpdates}
          onNotificationTap={() => setActiveTab('orders')}
        />
      )}

      {activeTab === 'saved' && (
        <SavedProducts
          saved={saved.saved}
          onRemove={saved.removeSaved}
          onTap={(productId) => handleSelectProduct(productId)}
        />
      )}

      {activeTab === 'orders' && (
        <CustomerOrders
          localOrders={customerOrders.orders}
          shopHandle={seller.handle}
          locale={locale}
        />
      )}

      <CustomerNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasOrderUpdates={customerOrders.hasUpdates}
      />
    </div>
  );
}
