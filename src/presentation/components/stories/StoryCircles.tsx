'use client';

import React, { useRef } from 'react';
import { Sparkles, User, Star, MessageCircle } from 'lucide-react';
import type { StoryGroup } from '@/presentation/types/Story';

interface StoryCirclesProps {
  groups: StoryGroup[];
  viewedIds: Set<string>;
  onTap: (groupIndex: number) => void;
}

const VIBE_ICONS: Record<string, typeof Sparkles> = {
  spotlight: Sparkles,
  'maker-bio': User,
  reviews: Star,
  'chat-reviews': MessageCircle,
};

export function StoryCircles({ groups, viewedIds, onTap }: StoryCirclesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (groups.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto no-scrollbar ps-4 py-2"
    >
      {groups.map((group, index) => {
        const isVibeStory = group.id in VIBE_ICONS;
        const isProduct = group.id.startsWith('product-');
        const isViewed = viewedIds.has(group.id);
        const Icon = VIBE_ICONS[group.id];

        const ringClass = isViewed
          ? 'bg-zinc-700'
          : isProduct
            ? 'bg-gradient-to-tr from-emerald-400 to-teal-500'
            : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600';

        return (
          <button
            key={group.id}
            onClick={() => onTap(index)}
            className="shrink-0"
          >
            <div className={`w-16 h-16 rounded-full p-[2px] ${ringClass}`}>
              <div className="w-full h-full rounded-full bg-black p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center">
                  {isVibeStory && Icon ? (
                    <Icon size={20} className="text-zinc-400" />
                  ) : group.thumbnailType === 'image' && group.thumbnail ? (
                    <img
                      src={group.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : group.thumbnailType === 'gradient' ? (
                    <div className={`w-full h-full bg-gradient-to-br ${group.thumbnail}`} />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {group.label.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
