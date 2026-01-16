'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TrendingUp, ShoppingBag, Plus, Sparkles, User } from 'lucide-react';

/**
 * Seller Dashboard Overview Page
 *
 * Shows key metrics, quick actions, and recent activity.
 */
export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as string;

  // TODO: Fetch from API/context
  const sellerName = 'Ayyuur Home';
  const pendingOrderCount = 3;
  const totalRevenue = 12450;

  const recentOrders = [
    {
      id: '1',
      customerName: 'Fatima Zahra',
      items: '2x Handmade Rug',
      total: 450,
      currency: 'MAD',
    },
    {
      id: '2',
      customerName: 'Mohammed Ali',
      items: '1x Ceramic Vase',
      total: 180,
      currency: 'MAD',
    },
    {
      id: '3',
      customerName: 'Amina Benali',
      items: '3x Argan Oil',
      total: 350,
      currency: 'MAD',
    },
  ];

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Hello, {sellerName.split(' ')[0]} 👋
          </h2>
          <p className="text-zinc-400 text-xs">Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
          <User size={18} className="text-zinc-400" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingUp size={40} />
          </div>
          <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Total Revenue</p>
          <h3 className="text-2xl font-bold text-white">
            {totalRevenue.toLocaleString()}{' '}
            <span className="text-xs font-normal text-zinc-500">MAD</span>
          </h3>
          <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
            <TrendingUp size={10} /> +12% vs last week
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <ShoppingBag size={40} />
          </div>
          <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Pending Orders</p>
          <h3 className="text-2xl font-bold text-white">{pendingOrderCount}</h3>
          <div className="mt-2 text-[10px] text-zinc-500">Needs attention</div>
        </div>
      </div>

      {/* Action Buttons */}
      <h3 className="text-sm font-bold text-white mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link
          href={`/${locale}/seller/inventory/new`}
          className="h-28 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-zinc-900 border border-emerald-500/20 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 group transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all">
            <Plus size={20} />
          </div>
          <span className="text-xs font-bold text-white">New Drop</span>
        </Link>

        <Link
          href={`/${locale}/seller/vibe`}
          className="h-28 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 flex flex-col items-center justify-center gap-2 group transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center transition-all">
            <Sparkles size={20} />
          </div>
          <span className="text-xs font-bold text-white">Shop Vibe</span>
        </Link>
      </div>

      {/* Recent Activity */}
      <h3 className="text-sm font-bold text-white mb-3">Recent Activity</h3>
      <div className="space-y-2">
        {recentOrders.map((order) => (
          <div
            key={order.id}
            className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-700">
                {order.customerName.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{order.customerName}</p>
                <p className="text-[10px] text-zinc-500">{order.items}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400">
              +{order.total} {order.currency}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
