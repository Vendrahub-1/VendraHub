'use client';

import { useState } from 'react';

export default function WishlistButton({ productId, compact = false }: { productId: string; compact?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function toggle() {
    setBusy(true); setMessage('');
    try {
      const response = saved
        ? await fetch('/api/customer/wishlist?product=' + encodeURIComponent(productId), { method: 'DELETE' })
        : await fetch('/api/customer/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shopify_product_gid: productId }) });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) { window.location.assign('/customer/login?next=' + encodeURIComponent(window.location.pathname)); return; }
        throw new Error(data.error || 'Could not update your wishlist.');
      }
      setSaved(!saved);
      setMessage(saved ? 'Removed from wishlist' : 'Saved to wishlist');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update wishlist.');
    } finally { setBusy(false); }
  }

  return <div className={compact ? 'vh-wishlist-control vh-wishlist-control-compact' : 'vh-wishlist-control'}>
    <button type="button" onClick={toggle} disabled={busy} aria-pressed={saved} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} className={saved ? 'vh-wishlist-button is-saved' : 'vh-wishlist-button'}>
      <span aria-hidden="true">{saved ? '♥' : '♡'}</span>{compact ? '' : saved ? 'Saved' : 'Save to wishlist'}
    </button>
    {message && <span role="status" className="vh-wishlist-button-message">{message}</span>}
  </div>;
}
