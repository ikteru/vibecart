'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Home, Heart, ClipboardList } from 'lucide-react';

export type CustomerTab = 'feed' | 'saved' | 'orders';

interface CustomerNavProps {
  activeTab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
  hasOrderUpdates?: boolean;
}

export function CustomerNav({
  activeTab,
  onTabChange,
  hasOrderUpdates = false,
}: CustomerNavProps) {
  const t = useTranslations('customer.nav');

  const tabs: { key: CustomerTab; icon: typeof Home; label: string }[] = [
    { key: 'orders', icon: ClipboardList, label: t('orders') },
    { key: 'saved', icon: Heart, label: t('saved') },
    { key: 'feed', icon: Home, label: t('feed') },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 safe-area-pb z-50">
      <div className="flex justify-around items-center px-4 py-1.5 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`relative flex flex-col items-center gap-0.5 px-5 py-1.5 transition-all ${
                active ? 'text-white' : 'text-zinc-500'
              }`}
            >
              {/* Active line indicator at top */}
              {active && (
                <span className="absolute -top-1.5 w-6 h-[2px] rounded-full bg-white" />
              )}
              <div className="relative">
                <Icon
                  size={24}
                  strokeWidth={active ? 2.5 : 1.8}
                  fill={active && tab.key === 'saved' ? 'currentColor' : 'none'}
                />
                {tab.key === 'orders' && hasOrderUpdates && (
                  <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
