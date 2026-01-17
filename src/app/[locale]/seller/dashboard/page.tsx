'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { TrendingUp, ShoppingBag, Plus, Sparkles } from 'lucide-react';

/**
 * Seller Dashboard Overview Page
 *
 * Shows key metrics, quick actions, and recent activity.
 */
export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();

  // TODO: Fetch from API/context
  const sellerName = 'Ayyuur Home';
  const pendingOrderCount = 3;
  const totalRevenue = 12450;

  const recentOrders = [
    {
      id: '1',
      customerNameKey: 'mockData.customers.customer1',
      items: '2x',
      itemKey: 'mockData.products.berberRug',
      total: 450,
    },
    {
      id: '2',
      customerNameKey: 'mockData.customers.customer2',
      items: '1x',
      itemKey: 'mockData.products.ceramicVase',
      total: 180,
    },
    {
      id: '3',
      customerNameKey: 'mockData.customers.customer3',
      items: '3x',
      itemKey: 'mockData.products.arganOilSet',
      total: 350,
    },
  ];

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          {t('seller.dashboard.hello', { name: sellerName.split(' ')[0] })} 👋
        </h2>
        <p className="text-zinc-400 text-xs">{t('seller.dashboard.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 end-0 p-3 opacity-10">
            <TrendingUp size={40} />
          </div>
          <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('seller.dashboard.totalRevenue')}</p>
          <h3 className="text-2xl font-bold text-white">
            {totalRevenue.toLocaleString()}{' '}
            <span className="text-xs font-normal text-zinc-500">{t('common.currency')}</span>
          </h3>
          <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
            <TrendingUp size={10} /> {t('seller.dashboard.revenueChange', { percent: 12 })}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 end-0 p-3 opacity-10">
            <ShoppingBag size={40} />
          </div>
          <p className="text-xs font-bold text-zinc-500 uppercase mb-1">{t('seller.dashboard.pendingOrders')}</p>
          <h3 className="text-2xl font-bold text-white">{pendingOrderCount}</h3>
          <div className="mt-2 text-[10px] text-zinc-500">{t('seller.dashboard.needsAttention')}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <h3 className="text-sm font-bold text-white mb-3">{t('seller.dashboard.quickActions')}</h3>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link
          href={`/${locale}/seller/inventory/new`}
          className="h-28 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-zinc-900 border border-emerald-500/20 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 group transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all">
            <Plus size={20} />
          </div>
          <span className="text-xs font-bold text-white">{t('seller.dashboard.newDrop')}</span>
        </Link>

        <Link
          href={`/${locale}/seller/vibe`}
          className="h-28 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 flex flex-col items-center justify-center gap-2 group transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center transition-all">
            <Sparkles size={20} />
          </div>
          <span className="text-xs font-bold text-white">{t('seller.vibe.title')}</span>
        </Link>
      </div>

      {/* Recent Activity */}
      <h3 className="text-sm font-bold text-white mb-3">{t('seller.dashboard.recentActivity')}</h3>
      <div className="space-y-2">
        {recentOrders.map((order) => {
          const customerName = t(order.customerNameKey);
          const itemName = t(order.itemKey);
          return (
            <div
              key={order.id}
              className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-700">
                  {customerName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{customerName}</p>
                  <p className="text-[10px] text-zinc-500">{order.items} {itemName}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                +{order.total} {t('currency.MAD_symbol')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
