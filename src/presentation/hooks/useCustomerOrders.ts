'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage, shopKey } from './useLocalStorage';

export interface LocalOrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  variant?: string;
  thumbnail?: string;
}

export interface LocalOrder {
  orderId: string;
  orderNumber: string;
  items: LocalOrderItem[];
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  fulfillmentType: 'delivery' | 'pickup';
  pickupCode?: string;
  createdAt: string;
  lastCheckedAt?: string;
}

const POLL_INTERVAL = 30_000; // 30 seconds

export function useCustomerOrders(shopHandle: string, isActive: boolean = false) {
  const [orders, setOrders] = useLocalStorage<LocalOrder[]>(
    shopKey(shopHandle, 'orders'),
    []
  );
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const addOrder = useCallback(
    (order: LocalOrder) => {
      setOrders((prev) => [order, ...prev]);
    },
    [setOrders]
  );

  const pollStatuses = useCallback(async () => {
    const activeOrders = orders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled'
    );
    if (activeOrders.length === 0) return;

    try {
      const ids = activeOrders.map((o) => o.orderId).join(',');
      const res = await fetch(`/api/orders/status?ids=${ids}`);
      if (!res.ok) return;

      const data = await res.json();
      if (!data.statuses) return;

      setOrders((prev) =>
        prev.map((order) => {
          const updated = data.statuses[order.orderId];
          if (updated && updated !== order.status) {
            return {
              ...order,
              status: updated,
              lastCheckedAt: new Date().toISOString(),
            };
          }
          return order;
        })
      );
    } catch {
      // Silently fail — polling is best-effort
    }
  }, [orders, setOrders]);

  // Poll when tab is active
  useEffect(() => {
    if (!isActive) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    // Immediate poll
    pollStatuses();

    pollRef.current = setInterval(pollStatuses, POLL_INTERVAL);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isActive, pollStatuses]);

  const hasUpdates = orders.some(
    (o) =>
      o.lastCheckedAt &&
      o.status !== 'pending' &&
      new Date(o.lastCheckedAt).getTime() > Date.now() - 60_000
  );

  return { orders, addOrder, hasUpdates };
}
