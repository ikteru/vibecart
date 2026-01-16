'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { SellerProfile } from '@/presentation/components/seller/SellerProfile';
import { VideoFeed } from '@/presentation/components/video/VideoFeed';
import { Product } from '@/domain/entities/Product';

/**
 * Create mock products for demo
 */
function createMockProducts(): Product[] {
  return [
    Product.create({
      sellerId: 'seller-1',
      title: 'Handmade Berber Rug',
      description: 'Authentic Moroccan craftsmanship',
      price: 450,
      stock: 5,
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      category: 'home',
    }),
    Product.create({
      sellerId: 'seller-1',
      title: 'Ceramic Vase Collection',
      description: 'Hand-painted traditional designs',
      price: 180,
      stock: 12,
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      category: 'home',
    }),
    Product.create({
      sellerId: 'seller-1',
      title: 'Argan Oil Set',
      description: 'Pure organic argan oil from Morocco',
      price: 280,
      discountPrice: 220,
      stock: 8,
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      category: 'beauty',
    }),
    Product.create({
      sellerId: 'seller-1',
      title: 'Leather Pouf Ottoman',
      description: 'Genuine Moroccan leather pouf',
      price: 400,
      stock: 3,
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      category: 'home',
    }),
  ];
}

/**
 * Mock shop configuration
 */
const MOCK_SHOP_CONFIG = {
  googleMaps: {
    enabled: true,
    rating: 4.8,
    reviews: 342,
    placeName: 'Ayyuur Home, Marrakech Medina',
  },
  spotlight: {
    enabled: true,
    title: 'Winter Sale',
    subtitle: 'Up to 50% Off Selected Items',
    color: 'from-orange-500 to-red-600',
  },
  makerBio: {
    enabled: true,
    name: 'Fatima',
    role: 'Master Artisan',
    bio: 'Creating traditional Moroccan crafts for over 20 years, preserving the authentic techniques passed down through generations.',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
  },
  reviews: [
    {
      id: 'r1',
      enabled: true,
      username: 'sarah_style',
      image: 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?w=400&q=80',
      note: 'Amazing quality! The rug is absolutely stunning ❤️',
    },
    {
      id: 'r2',
      enabled: true,
      username: 'morocco_lover',
      image: 'https://images.unsplash.com/photo-1528913753736-2313fa43cb8d?w=400&q=80',
      note: 'Fast shipping and beautiful products!',
    },
  ],
  whatsapp: {
    businessNumber: '+212600000000',
  },
  shipping: {
    defaultRate: 35,
    rules: [
      { city: 'Casablanca', rate: 25 },
      { city: 'Marrakech', rate: 0 },
      { city: 'Rabat', rate: 30 },
    ],
  },
};

type View = 'profile' | 'feed' | 'checkout';

/**
 * Shop Page
 *
 * Public-facing shop page with seller profile and video feed.
 */
export default function ShopPage() {
  const params = useParams();
  const handle = params.handle as string;

  // Memoize mock products to avoid recreating on each render
  const products = useMemo(() => createMockProducts(), []);

  const [view, setView] = useState<View>('profile');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Format handle for display (replace dashes with spaces, capitalize)
  const sellerName = handle
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

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
          sellerName={sellerName}
          sellerHandle={handle.replace(/-/g, '_')}
          products={products}
          shopConfig={MOCK_SHOP_CONFIG}
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
          shipping: MOCK_SHOP_CONFIG.shipping,
        }}
      />
    </div>
  );
}
