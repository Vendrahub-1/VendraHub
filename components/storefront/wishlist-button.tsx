'use client';

import { useState } from 'react';
import { useWishlist } from '@/components/storefront/wishlist-provider';

export default function WishlistButton({ productId, compact = false }: { productId: string; compact?: boolean }) {
  const { savedIds, toggle } = useWishlist();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const saved = savedIds.includes(productId);

  async function onToggle() {
    setBusy(true); setMessage('');
    try { await toggle(productId); setMessage(saved ? 'Removed from wishlist' : 'Saved to wishlist'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update wishlist.'); }
    finally { setBusy(false); }
  }

  return <div className={compact ? 'vh-wishlist-control vh-wishlist-control-compact' : 'vh-wishlist-control'}>
    <button type="button" onClick={onToggle} disabled={busy} aria-pressed={saved} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} className={saved ? 'vh-wishlist-button is-saved' : 'vh-wishlist-button'}>
      <span aria-hidden="true">{saved ? '♥' : '♡'}</span>{compact ? '' : saved ? 'Saved' : 'Save to wishlist'}
    </button>
    {message && <span role="status" className="vh-wishlist-button-message">{message}</span>}
  </div>;
}
