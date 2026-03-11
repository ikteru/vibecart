'use client';

import React, { useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface CategoryChipsProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
  hasSaleItems?: boolean;
}

export function CategoryChips({
  categories,
  activeCategory,
  onSelect,
  hasSaleItems = false,
}: CategoryChipsProps) {
  const t = useTranslations('customer.feed');
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll active chip into view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const chip = activeRef.current;
      const scrollLeft = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeCategory]);

  const allChips = [
    t('all'),
    ...categories,
    ...(hasSaleItems ? [t('sale')] : []),
  ];

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2"
    >
      {allChips.map((chip) => {
        const isAll = chip === t('all');
        const isActive =
          (isAll && activeCategory === 'all') ||
          (!isAll && activeCategory === chip);
        const isSale = chip === t('sale');

        return (
          <button
            key={chip}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelect(isAll ? 'all' : chip)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              isActive
                ? 'bg-white text-black'
                : isSale
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            {chip}
          </button>
        );
      })}
    </div>
  );
}
