'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutGrid,
  ShoppingBag,
  Package,
  Palette,
  Settings,
} from 'lucide-react';

interface SellerLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

/**
 * Seller Dashboard Layout
 *
 * Provides the bottom navigation bar shared across all seller pages.
 */
export default function SellerLayout({ children, params }: SellerLayoutProps) {
  const pathname = usePathname();
  const { locale } = params;
  const t = useTranslations('nav');

  const navItems = [
    { href: `/${locale}/seller/dashboard`, icon: LayoutGrid, labelKey: 'home', key: 'dashboard' },
    { href: `/${locale}/seller/orders`, icon: ShoppingBag, labelKey: 'orders', key: 'orders' },
    { href: `/${locale}/seller/inventory`, icon: Package, labelKey: 'inventory', key: 'inventory' },
    { href: `/${locale}/seller/vibe`, icon: Palette, labelKey: 'vibe', key: 'vibe' },
    { href: `/${locale}/seller/settings`, icon: Settings, labelKey: 'settings', key: 'settings' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white">
      <div className="flex-1 overflow-y-auto no-scrollbar p-6">{children}</div>

      {/* Bottom Navigation */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-2 safe-area-pb">
        <div className="flex justify-between items-center px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                  active
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[9px] font-bold">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
