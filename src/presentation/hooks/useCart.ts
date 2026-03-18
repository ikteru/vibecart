'use client';

import { useCallback } from 'react';
import { useLocalStorage, shopKey } from './useLocalStorage';

export interface CartItem {
  productId: string;
  title: string;
  price: number; // in minor units (centimes)
  currency: string;
  quantity: number;
  variant?: string;
  thumbnail?: string;
  discountPrice?: number;
  stock: number;
}

export function useCart(shopHandle: string) {
  const [items, setItems] = useLocalStorage<CartItem[]>(
    shopKey(shopHandle, 'cart'),
    []
  );

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (i) => i.productId === item.productId && i.variant === item.variant
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + (item.quantity || 1),
          };
          return updated;
        }
        return [...prev, { ...item, quantity: item.quantity || 1 }];
      });
    },
    [setItems]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variant?: string) => {
      if (quantity <= 0) {
        setItems((prev) =>
          prev.filter(
            (i) => !(i.productId === productId && i.variant === variant)
          )
        );
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.variant === variant
            ? { ...i, quantity }
            : i
        )
      );
    },
    [setItems]
  );

  const removeItem = useCallback(
    (productId: string, variant?: string) => {
      setItems((prev) =>
        prev.filter(
          (i) => !(i.productId === productId && i.variant === variant)
        )
      );
    },
    [setItems]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, [setItems]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = items.reduce((sum, i) => {
    const price = i.discountPrice ?? i.price;
    return sum + price * i.quantity;
  }, 0);

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
    subtotal,
  };
}
