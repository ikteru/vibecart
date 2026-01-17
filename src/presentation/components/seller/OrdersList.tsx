'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Filter,
  Search,
  MessageCircle,
  MoreHorizontal,
  Info,
} from 'lucide-react';
import { ComingSoonModal } from '@/presentation/components/ui/ComingSoonModal';
import type { OrderSummaryDTO } from '@/application/dtos/OrderDTO';
import type { OrderStatus } from '@/domain/entities/Order';

interface OrdersListProps {
  orders: OrderSummaryDTO[];
}

/**
 * Orders List Client Component
 *
 * Displays orders with filtering by status.
 * Receives real order data from server component.
 */
export function OrdersList({ orders }: OrdersListProps) {
  const t = useTranslations();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');

  const showFeatureComingSoon = (feature: string) => {
    setComingSoonFeature(feature);
    setShowComingSoon(true);
  };

  // Get currency symbol from translations
  const currencySymbol = t('common.currencySymbol');

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const filterOptions = [
    { key: 'all', label: t('seller.orders.filterAll') },
    { key: 'pending', label: t('seller.orders.filterPending') },
    { key: 'confirmed', label: t('seller.orders.filterConfirmed') },
    { key: 'shipped', label: t('seller.orders.filterShipped') },
    { key: 'delivered', label: t('seller.orders.filterDelivered') },
  ];

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-500/20 text-orange-400';
      case 'confirmed':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'shipped':
        return 'bg-blue-500/20 text-blue-400';
      case 'delivered':
        return 'bg-zinc-700 text-zinc-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-zinc-700 text-zinc-400';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    const statusLabels: Record<OrderStatus, string> = {
      pending: t('seller.orders.awaitingConfirm'),
      confirmed: t('seller.orders.filterConfirmed'),
      shipped: t('seller.orders.filterShipped'),
      delivered: t('seller.orders.filterDelivered'),
      cancelled: t('seller.orders.filterCancelled'),
    };
    return statusLabels[status] || status;
  };

  // Format relative time from ISO date string
  const formatRelativeTime = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return t('relativeTime.minutesAgo', { count: Math.max(1, diffMins) });
    } else if (diffHours < 24) {
      return t('relativeTime.hoursAgo', { count: diffHours });
    } else {
      return t('relativeTime.daysAgo', { count: diffDays });
    }
  };

  return (
    <div className="animate-fade-in pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{t('seller.orders.title')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => showFeatureComingSoon(t('common.search'))}
            className="p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white"
          >
            <Filter size={16} />
          </button>
          <button
            onClick={() => showFeatureComingSoon(t('common.search'))}
            className="p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white"
          >
            <Search size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {filterOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => setFilterStatus(option.key)}
            className={`px-4 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-colors ${
              filterStatus === option.key
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mb-4 bg-emerald-900/20 border border-emerald-500/20 p-3 rounded-xl flex gap-3">
        <Info size={18} className="text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-200">
          {t('seller.orders.pendingStatusExplainer')}
        </p>
      </div>

      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-zinc-500 text-sm">
              {t('seller.orders.noOrdersInFilter', {
                filter: filterOptions.find((o) => o.key === filterStatus)?.label || filterStatus,
              })}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl animate-fade-in"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {order.customerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{order.customerName}</h3>
                    <p className="text-[10px] text-zinc-500">
                      {order.orderNumber} • {formatRelativeTime(order.createdAt)}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusStyle(order.status)}`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="bg-black/30 p-3 rounded-xl mb-3">
                <p className="text-xs text-zinc-300 line-clamp-2">{order.itemsSummary}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-zinc-500">{t('checkout.total')}</span>
                  <span className="text-sm font-bold text-white">
                    {order.total.amount} {currencySymbol}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => showFeatureComingSoon(t('seller.orders.viewChat'))}
                  className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-black hover:text-white transition-colors py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <MessageCircle size={14} /> {t('seller.orders.viewChat')}
                  {order.hasUnreadMessages && (
                    <span className="bg-red-500 text-white text-[9px] px-1.5 rounded-full">
                      {t('seller.orders.new')}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => showFeatureComingSoon(t('seller.orders.viewDetails'))}
                  className="p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        featureName={comingSoonFeature}
      />
    </div>
  );
}
