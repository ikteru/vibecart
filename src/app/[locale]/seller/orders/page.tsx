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

/**
 * Order status type
 */
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

/**
 * Order interface with translation keys for locale-aware display
 */
interface OrderData {
  id: string;
  customerNameKey: string;
  dateKey: string;
  dateCount: number;
  itemsKey: string;
  total: number;
  status: OrderStatus;
  hasNewMessage: boolean;
}

/**
 * Seller Orders Page
 *
 * Shows all orders with filtering by status.
 */
export default function OrdersPage() {
  const t = useTranslations();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');

  const showFeatureComingSoon = (feature: string) => {
    setComingSoonFeature(feature);
    setShowComingSoon(true);
  };

  // Get currency symbol from translations (د.م. for Arabic, MAD for English)
  const currencySymbol = t('common.currencySymbol');

  // Mock orders using translation keys for locale-aware data
  const ordersData: OrderData[] = [
    {
      id: 'ORD-2341',
      customerNameKey: 'mockData.customers.customer1',
      dateKey: 'relativeTime.hoursAgo',
      dateCount: 2,
      itemsKey: 'mockData.orderItems.order1',
      total: 630,
      status: 'pending',
      hasNewMessage: true,
    },
    {
      id: 'ORD-2340',
      customerNameKey: 'mockData.customers.customer2',
      dateKey: 'relativeTime.hoursAgo',
      dateCount: 5,
      itemsKey: 'mockData.orderItems.order2',
      total: 280,
      status: 'confirmed',
      hasNewMessage: false,
    },
    {
      id: 'ORD-2339',
      customerNameKey: 'mockData.customers.customer3',
      dateKey: 'relativeTime.daysAgo',
      dateCount: 1,
      itemsKey: 'mockData.orderItems.order3',
      total: 1200,
      status: 'shipped',
      hasNewMessage: false,
    },
    {
      id: 'ORD-2338',
      customerNameKey: 'mockData.customers.customer4',
      dateKey: 'relativeTime.daysAgo',
      dateCount: 2,
      itemsKey: 'mockData.orderItems.order4',
      total: 450,
      status: 'delivered',
      hasNewMessage: false,
    },
  ];

  // Transform order data with translated values
  const orders = ordersData.map((order) => ({
    ...order,
    customerName: t(order.customerNameKey),
    date: t(order.dateKey, { count: order.dateCount }),
    items: t(order.itemsKey),
  }));

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
            <p className="text-zinc-500 text-sm">{t('seller.orders.noOrdersInFilter', { filter: filterOptions.find(o => o.key === filterStatus)?.label || filterStatus })}</p>
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
                      {order.id} • {order.date}
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
                <p className="text-xs text-zinc-300 line-clamp-2">{order.items}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-zinc-500">{t('checkout.total')}</span>
                  <span className="text-sm font-bold text-white">
                    {order.total} {currencySymbol}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => showFeatureComingSoon(t('seller.orders.viewChat'))}
                  className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-black hover:text-white transition-colors py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <MessageCircle size={14} /> {t('seller.orders.viewChat')}
                  {order.hasNewMessage && (
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
