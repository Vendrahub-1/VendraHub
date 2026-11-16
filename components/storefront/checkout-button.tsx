'use client';

import { useState } from 'react';

export default function CheckoutButton({ variantId, available }: { variantId: string | null; available: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function checkout() {
    if (!variantId || !available || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: [{ merchandiseId: variantId, quantity: 1 }] }),
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.checkoutUrl !== 'string') {
        throw new Error(payload.error || 'Checkout is temporarily unavailable.');
      }
      const destination = new URL(payload.checkoutUrl);
      if (destination.protocol !== 'https:' || !destination.hostname.endsWith('.myshopify.com')) {
        throw new Error('Shopify returned an unexpected checkout destination.');
      }
      window.location.assign(destination.toString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to start checkout.');
      setBusy(false);
    }
  }

  return (
    <div className="store-checkout">
      <button type="button" onClick={checkout} disabled={!variantId || !available || busy}>
        {busy ? 'Opening secure checkout…' : available ? 'Buy now' : 'Sold out'}
      </button>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
