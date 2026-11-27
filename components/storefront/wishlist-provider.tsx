'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type WishlistContextValue = { savedIds: string[]; ready: boolean; toggle: (productId: string) => Promise<void> };
const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/customer/wishlist', { cache: 'no-store' })
      .then(async response => { if (!response.ok) return null; return response.json(); })
      .then(data => { if (active && data) setSavedIds((data.items ?? []).map((item: { shopify_product_gid: string }) => item.shopify_product_gid)); })
      .catch(() => {})
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  async function toggle(productId: string) {
    const saved = savedIds.includes(productId);
    const response = saved
      ? await fetch('/api/customer/wishlist?product=' + encodeURIComponent(productId), { method: 'DELETE' })
      : await fetch('/api/customer/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shopify_product_gid: productId }) });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') { window.location.assign('/customer/login?next=' + encodeURIComponent(window.location.pathname)); return; }
      throw new Error(data.error || 'Could not update your wishlist.');
    }
    setSavedIds(current => saved ? current.filter(id => id !== productId) : [...current, productId]);
  }

  const value = useMemo(() => ({ savedIds, ready, toggle }), [savedIds, ready]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error('useWishlist must be used inside WishlistProvider.');
  return value;
}
