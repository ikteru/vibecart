'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ShoppingBag,
  Package,
  Plus,
  Eye,
  User,
} from 'lucide-react';

interface SellerNavProps {
  locale: string;
  shopHandle?: string;
}

/**
 * Seller Navigation Component
 *
 * Bottom navigation bar with 5 tabs: Orders, Inventory, [+Add], Preview, Profile.
 */
export function SellerNav({ locale, shopHandle }: SellerNavProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tp = useTranslations('sellerProfile');

  const navItems = [
    { href: `/${locale}/seller/orders`, icon: ShoppingBag, label: t('orders'), key: 'orders' },
    { href: `/${locale}/seller/inventory`, icon: Package, label: t('inventory'), key: 'inventory' },
    { href: `/${locale}/seller/inventory/new`, icon: Plus, label: tp('addProduct'), key: 'add', isCenter: true },
    { href: shopHandle ? `/${locale}/shop/${shopHandle}` : `/${locale}/seller/dashboard`, icon: Eye, label: tp('preview'), key: 'preview' },
    { href: `/${locale}/seller/profile`, icon: User, label: 'Profile', key: 'profile' },
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (item.key === 'add') return false; // Never highlight center button as active
    if (item.key === 'profile') {
      return pathname.includes('/seller/profile') || pathname.includes('/seller/settings') || pathname.includes('/seller/vibe') || pathname.includes('/seller/dashboard');
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  return (
    <div className="fixed bottom-0 inset-x-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 safe-area-pb z-50">
      <div className="flex justify-between items-center px-4 py-1.5 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          // Center [+] button — elevated emerald circle
          if (item.isCenter) {
            return (
              <Link
                key={item.key}
                href={item.href}
                className="relative -mt-5 flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-colors">
                  <Plus size={24} className="text-white" strokeWidth={2.5} />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 px-3 py-1 transition-all ${
                active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">{item.label}</span>
              {active && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
