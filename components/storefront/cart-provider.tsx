'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type VendraCartItem = {
  variantId: string;
  productId: string;
  handle: string;
  title: string;
  imageUrl: string | null;
  price: string;
  currencyCode: string;
  quantity: number;
};

type CartContextValue = {
  items: VendraCartItem[];
  ready: boolean;
  addItem: (item: Omit<VendraCartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = 'vendrahub-shopping-bag-v1';
const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is VendraCartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<VendraCartItem>;
  return typeof item.variantId === 'string' &&
    /^gid:\/\/shopify\/ProductVariant\/\d+$/.test(item.variantId) &&
    typeof item.productId === 'string' &&
    typeof item.handle === 'string' &&
    typeof item.title === 'string' &&
    (typeof item.imageUrl === 'string' || item.imageUrl === null) &&
    typeof item.price === 'string' &&
    typeof item.currencyCode === 'string' &&
    Number.isInteger(item.quantity) && Number(item.quantity) >= 1 && Number(item.quantity) <= 20;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<VendraCartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed.filter(isCartItem).slice(0, 50));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Keep the in-memory cart usable if browser storage is unavailable or full.
    }
  }, [items, ready]);

  function addItem(item: Omit<VendraCartItem, 'quantity'>, quantity = 1) {
    if (!item.variantId || !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(item.variantId)) return;
    const safeQuantity = Math.min(20, Math.max(1, Math.floor(quantity)));
    setItems(current => {
      const existing = current.find(line => line.variantId === item.variantId);
      if (existing) return current.map(line => line.variantId === item.variantId
        ? { ...line, quantity: Math.min(20, line.quantity + safeQuantity) }
        : line);
      if (current.length >= 50) return current;
      return [...current, { ...item, quantity: safeQuantity }];
    });
  }

  function updateQuantity(variantId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    setItems(current => current.map(line => line.variantId === variantId
      ? { ...line, quantity: Math.min(20, quantity) }
      : line));
  }

  function removeItem(variantId: string) {
    setItems(current => current.filter(line => line.variantId !== variantId));
  }

  function clearCart() {
    setItems([]);
  }

  const value = useMemo(() => ({ items, ready, addItem, updateQuantity, removeItem, clearCart }), [items, ready]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useVendraCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useVendraCart must be used inside CartProvider.');
  return value;
}
