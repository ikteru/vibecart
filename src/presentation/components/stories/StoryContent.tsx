'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Star } from 'lucide-react';
import type {
  StoryItem,
  SpotlightStoryData,
  MakerBioStoryData,
  ReviewStoryData,
  ChatReviewStoryData,
  ProductStoryData,
} from '@/presentation/types/Story';

interface StoryContentProps {
  item: StoryItem;
}

/**
 * Renders the content for a single story item based on its type
 */
export function StoryContent({ item }: StoryContentProps) {
  switch (item.type) {
    case 'spotlight':
      return <SpotlightContent data={item.data} />;
    case 'makerBio':
      return <MakerBioContent data={item.data} />;
    case 'review':
      return <ReviewContent data={item.data} />;
    case 'chatReview':
      return <ChatReviewContent data={item.data} />;
    case 'product':
      return <ProductContent data={item.data} />;
  }
}

function SpotlightContent({ data }: { data: SpotlightStoryData }) {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${data.color || 'from-emerald-500 to-teal-600'} p-8`}>
      <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
        <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">LIMITED</span>
      </div>
      <h2 className="text-white text-3xl font-bold text-center mb-3">
        {data.title}
      </h2>
      <p className="text-white/70 text-lg text-center">
        {data.subtitle}
      </p>
    </div>
  );
}

function MakerBioContent({ data }: { data: MakerBioStoryData }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 p-8">
      {data.imageUrl ? (
        <img
          src={data.imageUrl}
          alt={data.name}
          className="w-28 h-28 rounded-full object-cover border-4 border-zinc-700 mb-6"
        />
      ) : (
        <div className="w-28 h-28 rounded-full bg-zinc-800 flex items-center justify-center border-4 border-zinc-700 mb-6">
          <span className="text-white text-4xl font-bold">{data.name.charAt(0)}</span>
        </div>
      )}
      <h2 className="text-white text-2xl font-bold mb-1">{data.name}</h2>
      <p className="text-zinc-400 text-sm mb-4">{data.role}</p>
      <p className="text-zinc-300 text-center italic text-lg leading-relaxed max-w-xs">
        &ldquo;{data.bio}&rdquo;
      </p>
    </div>
  );
}

function ReviewContent({ data }: { data: ReviewStoryData }) {
  return (
    <div className="w-full h-full relative bg-black">
      <img
        src={data.imageUrl}
        alt="Review"
        className="w-full h-full object-contain"
      />
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-16">
        {data.rating != null && (
          <div className="flex gap-0.5 mb-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={16}
                className={i < data.rating! ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}
              />
            ))}
          </div>
        )}
        {data.text && (
          <p className="text-white text-sm mb-1">{data.text}</p>
        )}
        {data.username && (
          <p className="text-zinc-400 text-xs">— {data.username}</p>
        )}
      </div>
    </div>
  );
}

function ChatReviewContent({ data }: { data: ChatReviewStoryData }) {
  return (
    <div className="w-full h-full relative bg-black">
      <img
        src={data.imageUrl}
        alt="Chat review"
        className="w-full h-full object-contain"
      />
      {data.customerName && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-16">
          <p className="text-white text-sm font-medium">
            {data.customerName}
            {data.platform && (
              <span className="text-zinc-400 ms-2">
                {data.platform === 'whatsapp' ? '💬' : '📸'}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function ProductContent({ data }: { data: ProductStoryData }) {
  const t = useTranslations('customer.stories');
  const locale = useLocale();
  const { product } = data;
  const price = product.price;
  const discountPrice = product.discountPrice;

  return (
    <div className="w-full h-full relative bg-black flex flex-col">
      <div className="flex-1 relative bg-zinc-900">
        {product.videoUrl ? (
          <video
            src={product.videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-zinc-600 text-lg">{product.title}</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6 pt-20">
        <h3 className="text-white text-xl font-bold mb-2">{product.title}</h3>
        <div className="flex items-baseline gap-2 mb-4">
          {discountPrice ? (
            <>
              <span className="text-emerald-400 text-2xl font-bold">
                {discountPrice.format(locale)}
              </span>
              <span className="text-zinc-500 line-through text-sm">
                {price.format(locale)}
              </span>
            </>
          ) : (
            <span className="text-white text-2xl font-bold">
              {price.format(locale)}
            </span>
          )}
        </div>
        <div className="bg-emerald-500 text-white text-center py-3 rounded-xl font-semibold">
          {t('viewProduct')}
        </div>
      </div>
    </div>
  );
}
