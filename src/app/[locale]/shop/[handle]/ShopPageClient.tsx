'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { VideoFeed } from '@/presentation/components/video/VideoFeed';
import { CustomerNav, type CustomerTab } from '@/presentation/components/customer/CustomerNav';
import { SavedProducts } from '@/presentation/components/customer/SavedProducts';
import { CustomerOrders } from '@/presentation/components/customer/CustomerOrders';
import { StoryCircles } from '@/presentation/components/stories/StoryCircles';
import { StoryViewer } from '@/presentation/components/stories/StoryViewer';
import { ProductGrid } from '@/presentation/components/customer/ProductGrid';
import { CategoryChips } from '@/presentation/components/customer/CategoryChips';
import { useStoryGroups } from '@/presentation/hooks/useStoryGroups';
import { useLocalStorage } from '@/presentation/hooks/useLocalStorage';
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
  const t = useTranslations();
  const products = useMemo(
    () => productDTOs.map(dtoToProduct),
    [productDTOs]
  );

  const [activeTab, setActiveTab] = useState<CustomerTab>('feed');
  const [showVideoFeed, setShowVideoFeed] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

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

  // Story groups from vibe config + featured products
  const storyGroups = useStoryGroups(
    {
      spotlight: shopConfig.spotlight,
      makerBio: shopConfig.makerBio,
      reviews: shopConfig.reviews,
      chatReviews: shopConfig.chatReviews,
    },
    products
  );

  // Track viewed stories in localStorage
  const [viewedStoryIds, setViewedStoryIds] = useLocalStorage<string[]>(
    `vibecart_stories_viewed_${seller.handle}`,
    []
  );
  const viewedSet = useMemo(() => new Set(viewedStoryIds), [viewedStoryIds]);

  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null);

  // Category filtering for grid
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return products;
    if (selectedCategory === 'sale') return products.filter((p) => p.discountPrice);
    return products.filter((p) => p.category?.value === selectedCategory);
  }, [products, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category?.value) cats.add(p.category.value);
    });
    return Array.from(cats);
  }, [products]);

  const hasSaleItems = useMemo(
    () => products.some((p) => p.discountPrice),
    [products]
  );

  const handleStoryViewed = useCallback(
    (groupId: string) => {
      setViewedStoryIds((prev) => {
        if (prev.includes(groupId)) return prev;
        return [...prev, groupId];
      });
    },
    [setViewedStoryIds]
  );

  const handleStoryProductTap = useCallback(
    (groupIndex: number) => {
      const group = storyGroups[groupIndex];
      if (group && group.items[0]?.type === 'product') {
        // For product stories, open video feed directly
        const productId = group.items[0].data.product.id;
        handleSelectProduct(productId);
      } else {
        // For vibe stories, open story viewer
        setStoryViewerIndex(groupIndex);
      }
    },
    [storyGroups, handleSelectProduct]
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

  // Story viewer overlay
  if (storyViewerIndex !== null) {
    return (
      <StoryViewer
        groups={storyGroups}
        initialGroupIndex={storyViewerIndex}
        onClose={() => setStoryViewerIndex(null)}
        onViewed={handleStoryViewed}
      />
    );
  }

  // Tabbed customer experience
  return (
    <div className="h-screen bg-zinc-900">
      <div className="h-full overflow-y-auto no-scrollbar bg-black">
        {/* Compact profile header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-1">
          {seller.shopConfig?.instagram?.profilePictureUrl ? (
            <img
              src={seller.shopConfig.instagram.profilePictureUrl}
              alt={seller.shopName}
              className="w-14 h-14 rounded-full object-cover border border-zinc-600 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center border border-zinc-600 shrink-0">
              <span className="text-white font-bold text-xl">
                {seller.shopName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-white font-bold text-base leading-tight">{seller.shopName}</h1>
            <p className="text-zinc-500 text-sm" dir="ltr">
              {'@'}{seller.shopConfig?.instagram?.handle || seller.handle}
            </p>
          </div>
        </div>
        {seller.shopConfig?.instagram?.biography && (
          <div className="px-4 pb-2">
            <p className={`text-zinc-400 text-xs leading-relaxed ${bioExpanded ? '' : 'line-clamp-2'}`}>
              {seller.shopConfig.instagram.biography}
            </p>
            <button
              onClick={() => setBioExpanded(!bioExpanded)}
              className="text-zinc-500 text-xs font-medium mt-0.5"
            >
              {bioExpanded ? t('customer.feed.showLess') : t('customer.feed.readMore')}
            </button>
          </div>
        )}

        {/* Story circles */}
        {storyGroups.length > 0 && (
          <StoryCircles
            groups={storyGroups}
            viewedIds={viewedSet}
            onTap={handleStoryProductTap}
          />
        )}

        {/* Category chips — only if 3+ categories */}
        {categories.length >= 3 && (
          <CategoryChips
            categories={categories}
            activeCategory={selectedCategory || 'all'}
            onSelect={(cat) => setSelectedCategory(cat === 'all' ? null : cat)}
            hasSaleItems={hasSaleItems}
          />
        )}

        {/* Product grid */}
        <ProductGrid
          products={filteredProducts}
          onSelectProduct={handleSelectProduct}
        />
      </div>
    </div>
  );
}
