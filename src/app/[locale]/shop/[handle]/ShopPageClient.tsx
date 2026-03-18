'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical, Heart, ClipboardList, Share2, X } from 'lucide-react';
import { DirectionalIcon } from '@/presentation/components/ui/DirectionalIcon';
import { StoryCircles } from '@/presentation/components/stories/StoryCircles';
import { StoryViewer } from '@/presentation/components/stories/StoryViewer';
import { ProductGrid } from '@/presentation/components/customer/ProductGrid';
import { CategoryChips } from '@/presentation/components/customer/CategoryChips';
import { SavedProducts } from '@/presentation/components/customer/SavedProducts';
import { CustomerOrders } from '@/presentation/components/customer/CustomerOrders';
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
  const router = useRouter();
  const products = useMemo(
    () => productDTOs.map(dtoToProduct),
    [productDTOs]
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<'menu' | 'saved' | 'orders'>('menu');
  const [bioExpanded, setBioExpanded] = useState(false);

  // Hooks for local customer data
  const saved = useSaved(seller.handle);
  const customerOrders = useCustomerOrders(seller.handle, menuView === 'orders');

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

  // Navigate to product URL (reel view) — URL-driven, no client state
  const handleSelectProduct = useCallback((productId: string) => {
    router.push(`/${locale}/shop/${seller.handle}/${productId}`);
  }, [router, locale, seller.handle]);

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

  const handleShareShop = useCallback(async () => {
    const url = `${window.location.origin}/${locale}/shop/${seller.handle}`;
    await navigator.clipboard.writeText(url);
    setMenuOpen(false);
  }, [locale, seller.handle]);

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

  // Shop profile view
  return (
    <div className="h-screen bg-black">
      {/* Instagram-style top header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1 text-white"
          >
            <DirectionalIcon icon={ArrowLeft} size={22} />
          </button>
          <span className="text-white font-semibold text-sm" dir="ltr">
            {seller.shopConfig?.instagram?.handle || seller.handle}
          </span>
          <button
            onClick={() => { setMenuOpen(true); setMenuView('menu'); }}
            className="p-1 text-white"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute bottom-0 inset-x-0 bg-zinc-900 rounded-t-2xl max-h-[80vh] overflow-y-auto safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            {menuView === 'menu' && (
              <div className="py-4">
                <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-4" />
                <button
                  onClick={() => setMenuView('saved')}
                  className="flex items-center gap-3 w-full px-6 py-3 text-white hover:bg-zinc-800"
                >
                  <Heart size={20} className="text-zinc-400" />
                  <span className="text-sm">{t('customer.nav.saved')}</span>
                </button>
                <button
                  onClick={() => setMenuView('orders')}
                  className="flex items-center gap-3 w-full px-6 py-3 text-white hover:bg-zinc-800"
                >
                  <ClipboardList size={20} className="text-zinc-400" />
                  <span className="text-sm">{t('customer.nav.orders')}</span>
                </button>
                <button
                  onClick={handleShareShop}
                  className="flex items-center gap-3 w-full px-6 py-3 text-white hover:bg-zinc-800"
                >
                  <Share2 size={20} className="text-zinc-400" />
                  <span className="text-sm">{t('sellerProfile.shareShopLink')}</span>
                </button>
              </div>
            )}
            {menuView === 'saved' && (
              <div className="pt-4">
                <div className="flex items-center justify-between px-4 pb-3">
                  <button onClick={() => setMenuView('menu')} className="p-1 text-white">
                    <DirectionalIcon icon={ArrowLeft} size={20} />
                  </button>
                  <span className="text-white font-semibold text-sm">{t('customer.nav.saved')}</span>
                  <button onClick={() => setMenuOpen(false)} className="p-1 text-white">
                    <X size={20} />
                  </button>
                </div>
                <SavedProducts
                  saved={saved.saved}
                  onRemove={saved.removeSaved}
                  onTap={(productId) => { setMenuOpen(false); handleSelectProduct(productId); }}
                />
              </div>
            )}
            {menuView === 'orders' && (
              <div className="pt-4">
                <div className="flex items-center justify-between px-4 pb-3">
                  <button onClick={() => setMenuView('menu')} className="p-1 text-white">
                    <DirectionalIcon icon={ArrowLeft} size={20} />
                  </button>
                  <span className="text-white font-semibold text-sm">{t('customer.nav.orders')}</span>
                  <button onClick={() => setMenuOpen(false)} className="p-1 text-white">
                    <X size={20} />
                  </button>
                </div>
                <CustomerOrders
                  localOrders={customerOrders.orders}
                  shopHandle={seller.handle}
                  locale={locale}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-full overflow-y-auto no-scrollbar">
        {/* Profile header */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-1">
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
