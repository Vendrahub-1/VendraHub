'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CustomerBottomNav from '@/components/storefront/customer-bottom-nav';

type WishlistItem = { id: string; shopify_product_gid: string; created_at: string };

export default function CustomerWishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/customer/wishlist', { cache: 'no-store' })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Sign in to view your saved products.');
        if (active) setItems(data.items ?? []);
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load your wishlist.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function removeItem(gid: string) {
    setBusyId(gid); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/wishlist?product=' + encodeURIComponent(gid), { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not remove this saved product.');
      setItems(current => current.filter(item => item.shopify_product_gid !== gid));
      setNotice('Product removed from your wishlist.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not remove this product.'); }
    finally { setBusyId(''); }
  }

  return (
    <main className="vh-store vh-wishlist-page">
      <header className="vh-store-header">
        <Link href="/customer" className="vh-store-brand"><Image src="/vendrahub-logo.svg" alt="VendraHub" width={220} height={64} priority /></Link>
        
      </header>
      <section className="vh-wishlist-hero"><p className="vh-overline">YOUR SAVED COLLECTION</p><h1>Things you<br/><em>love.</em></h1><p>Save products you like and come back whenever you are ready. Your wishlist stays separate from your shopping orders.</p></section>
      {error && <p className="vh-wishlist-feedback" role="alert">{error} <Link href="/customer/login">Sign in</Link></p>}
      {notice && <p className="vh-wishlist-feedback" role="status">{notice}</p>}
      {loading ? <div className="vh-store-message">Loading your saved products…</div> : items.length ? <section className="vh-wishlist-list" aria-label="Saved products">{items.map(item => <article className="vh-wishlist-item" key={item.id}><div><strong>Saved product</strong><small>Product reference: {item.shopify_product_gid.split('/').pop()}</small><small>Saved {new Date(item.created_at).toLocaleDateString()}</small></div><button type="button" onClick={() => removeItem(item.shopify_product_gid)} disabled={busyId === item.shopify_product_gid}>{busyId === item.shopify_product_gid ? 'Removing…' : 'Remove from wishlist'}</button></article>)}</section> : !error && <section className="vh-wishlist-empty"><strong>Your wishlist is waiting.</strong><p>Save products while browsing and they will appear here. You do not need to purchase them immediately.</p><Link href="/customer/categories" className="vh-button vh-button-dark">Explore categories →</Link></section>}
      <CustomerBottomNav active="Wishlist" />
    </main>
  );
}
