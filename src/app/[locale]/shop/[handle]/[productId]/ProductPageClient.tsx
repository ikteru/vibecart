'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { VideoFeed } from '@/presentation/components/video/VideoFeed';
import { Product } from '@/domain/entities/Product';
import { Money, type Currency } from '@/domain/value-objects/Money';
import { ProductCategory } from '@/domain/value-objects/ProductCategory';
import type { ProductResponseDTO } from '@/application/dtos/ProductDTO';
import type { PublicSellerDTO } from '@/application/dtos/SellerDTO';

interface ProductPageClientProps {
  seller: PublicSellerDTO;
  products: ProductResponseDTO[];
  initialProductId: string;
}

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

export function ProductPageClient({
  seller,
  products: productDTOs,
  initialProductId,
}: ProductPageClientProps) {
  const router = useRouter();

  const products = useMemo(
    () => productDTOs.map(dtoToProduct),
    [productDTOs]
  );

  const shopConfig = useMemo(() => {
    const shipping = seller.shopConfig?.shipping;
    const pickup = seller.shopConfig?.pickup;
    return {
      shipping: {
        defaultRate: shipping?.defaultRate || 35,
        freeShippingThreshold: shipping?.freeShippingThreshold,
        rules: shipping?.rules || [],
      },
      pickup: pickup,
    };
  }, [seller]);

  return (
    <div className="h-screen bg-black">
      <VideoFeed
        products={products}
        sellerId={seller.id}
        initialVideoId={initialProductId}
        onBack={() => router.back()}
        shopConfig={shopConfig}
        sellerName={seller.shopName}
        sellerHandle={seller.handle}
      />
    </div>
  );
}
