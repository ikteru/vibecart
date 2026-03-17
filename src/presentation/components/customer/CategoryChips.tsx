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

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const chip = activeRef.current;
      const scrollLeft = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeCategory]);

  const allChips = [
    { key: 'all', label: t('all') },
    ...categories.map((cat) => ({ key: cat, label: cat })),
    ...(hasSaleItems ? [{ key: 'sale', label: t('sale') }] : []),
  ];

  return (
    <div
      ref={scrollRef}
      className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 py-2"
    >
      {allChips.map((chip) => {
        const isActive = activeCategory === chip.key;
        const isSale = chip.key === 'sale';

        return (
          <button
            key={chip.key}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelect(chip.key)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              isActive
                ? 'bg-zinc-700 text-white'
                : isSale
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
