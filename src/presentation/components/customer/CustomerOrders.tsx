'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  ClipboardList,
  Package,
  Store,
  ChevronDown,
  ChevronUp,
  Key,
  LogOut,
  Loader2,
} from 'lucide-react';
import { CustomerLogin } from './CustomerLogin';
import { useCustomerSession } from '@/presentation/hooks/useCustomerSession';
import type { LocalOrder } from '@/presentation/hooks/useCustomerOrders';

interface CustomerOrdersProps {
  /** Orders from localStorage (placed during this session) */
  localOrders: LocalOrder[];
  shopHandle: string;
  locale: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  shipped: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function CustomerOrders({ localOrders, shopHandle, locale }: CustomerOrdersProps) {
  const t = useTranslations('customer');
  const session = useCustomerSession();
  const [serverOrders, setServerOrders] = useState<LocalOrder[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch orders from server when logged in
  const fetchOrders = useCallback(async () => {
    if (!session.isLoggedIn) return;

    setIsFetching(true);
    try {
      const res = await fetch(`/api/auth/customer/orders?shop=${encodeURIComponent(shopHandle)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.orders) {
          setServerOrders(data.orders);
        }
      }
    } catch {
      // Silently fail — fall back to local orders
    } finally {
      setIsFetching(false);
    }
  }, [session.isLoggedIn, shopHandle]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Merge local and server orders, deduplicate by orderId
  const allOrders = React.useMemo(() => {
    if (!session.isLoggedIn) return localOrders;

    const orderMap = new Map<string, LocalOrder>();
    // Server orders take priority (have real data)
    for (const order of serverOrders) {
      orderMap.set(order.orderId, order);
    }
    // Add local orders that aren't in server results
    for (const order of localOrders) {
      if (!orderMap.has(order.orderId)) {
        orderMap.set(order.orderId, order);
      }
    }
    // Sort by createdAt desc
    return Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [session.isLoggedIn, serverOrders, localOrders]);

  // Loading state while checking session
  if (session.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="text-zinc-500 animate-spin" />
      </div>
    );
  }

  // Not logged in and no local orders — show login form
  if (!session.isLoggedIn && localOrders.length === 0) {
    return (
      <div className="min-h-screen bg-black pb-20">
        <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3">
          <h1 className="text-white font-bold text-lg">{t('orders.title')}</h1>
        </div>
        <CustomerLogin
          shopHandle={shopHandle}
          redirectUrl={`/${locale}/shop/${shopHandle}`}
        />
      </div>
    );
  }

  // Has orders (local or server)
  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-bold text-lg">{t('orders.title')}</h1>
          {session.isLoggedIn && (
            <button
              onClick={session.logout}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
            >
              <span>{session.displayPhone}</span>
              <LogOut size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Login prompt for non-authenticated users with local orders */}
      {!session.isLoggedIn && localOrders.length > 0 && (
        <div className="mx-4 mt-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-sm text-zinc-400 mb-3">{t('login.subtitle')}</p>
          <CustomerLogin
            shopHandle={shopHandle}
            redirectUrl={`/${locale}/shop/${shopHandle}`}
          />
        </div>
      )}

      {/* Loading indicator for server orders */}
      {isFetching && (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={18} className="text-zinc-500 animate-spin" />
        </div>
      )}

      {/* Orders list */}
      {allOrders.length === 0 && !isFetching ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
            <ClipboardList size={28} className="text-zinc-500" />
          </div>
          <p className="text-zinc-400 font-medium">{t('orders.empty')}</p>
          <p className="text-zinc-600 text-sm mt-2">{t('orders.emptyHint')}</p>
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-3">
          {allOrders.map((order) => {
            const isExpanded = expandedId === order.orderId;
            const isPickup = order.fulfillmentType === 'pickup';
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

            return (
              <div
                key={order.orderId}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : order.orderId)
                  }
                  className="w-full p-4 text-start"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {isPickup ? (
                        <Store size={16} className="text-emerald-400" />
                      ) : (
                        <Package size={16} className="text-zinc-400" />
                      )}
                      <span className="text-white font-medium text-sm">
                        {order.orderNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}
                      >
                        {t(`orders.status.${order.status}`)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-zinc-500" />
                      ) : (
                        <ChevronDown size={16} className="text-zinc-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-zinc-500 text-xs">
                    <span>
                      {itemCount === 1 ? t('orders.item') : t('orders.items', { count: itemCount })}
                    </span>
                    <span>·</span>
                    <span className="text-white font-medium">
                      {order.total} {order.currency}
                    </span>
                    <span>·</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>

                  {/* Pickup code */}
                  {isPickup && order.pickupCode && (
                    <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                      <Key size={12} className="text-emerald-400" />
                      <span className="text-emerald-400 font-mono font-bold text-sm">
                        {order.pickupCode}
                      </span>
                    </div>
                  )}

                  {/* Item thumbnails preview */}
                  {!isExpanded && order.items.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div
                          key={i}
                          className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0"
                        >
                          {item.thumbnail ? (
                            <video
                              src={item.thumbnail}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={14} className="text-zinc-600" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-medium">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-zinc-800">
                    <div className="space-y-2 mt-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                            {item.thumbnail ? (
                              <video
                                src={item.thumbnail}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={12} className="text-zinc-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm line-clamp-1">{item.title}</p>
                            {item.variant && (
                              <p className="text-zinc-500 text-xs">{item.variant}</p>
                            )}
                          </div>
                          <div className="text-end flex-shrink-0">
                            <p className="text-white text-sm font-medium">
                              {item.price * item.quantity} {order.currency}
                            </p>
                            <p className="text-zinc-500 text-xs">×{item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Total</span>
                      <span className="text-white font-bold">
                        {order.total} {order.currency}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
