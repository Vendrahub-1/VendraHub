'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import CustomerBottomNav from '@/components/storefront/customer-bottom-nav';
import { useVendraCart } from '@/components/storefront/cart-provider';

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export default function CustomerCartPage() {
  const { items, ready, updateQuantity, removeItem, clearCart } = useVendraCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const currency = items[0]?.currencyCode ?? 'NGN';
  const mixedCurrencies = items.some(item => item.currencyCode !== currency);
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  async function checkout() {
    if (!items.length || busy || mixedCurrencies) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: items.map(item => ({ merchandiseId: item.variantId, quantity: item.quantity })) }),
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.checkoutUrl !== 'string') {
        throw new Error(payload.error || 'Secure checkout is temporarily unavailable.');
      }
      const destination = new URL(payload.checkoutUrl);
      if (destination.protocol !== 'https:' || !destination.hostname.endsWith('.myshopify.com')) {
        throw new Error('Shopify returned an unexpected checkout destination.');
      }
      clearCart();
      window.location.assign(destination.toString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to start checkout.');
      setBusy(false);
    }
  }

  return (
    <main className="vh-store vh-cart-page">
      <header className="vh-store-header">
        <Link href="/customer" className="vh-store-brand"><Image src="/vendrahub-logo.svg" alt="VendraHub" width={220} height={64} priority /></Link>
      </header>
      <section className="vh-secondary-hero vh-cart-hero">
        <p className="vh-overline">YOUR SELECTION</p>
        <h1>Your shopping<br/><em>bag.</em></h1>
        <p>Your selected products stay in this browser while you continue shopping. Secure payment and final delivery charges are handled by Shopify checkout.</p>
      </section>
      {!ready ? <div className="vh-store-message" role="status">Loading your shopping bag…</div> : items.length === 0 ? (
        <section className="vh-cart-next">
          <strong>Your shopping bag is empty.</strong>
          <p>Explore the VendraHub collection and add products you would like to purchase.</p>
          <Link href="/customer/categories" className="vh-button vh-button-dark">Explore products →</Link>
        </section>
      ) : (
        <section className="vh-cart-content" aria-label="Shopping bag">
          <div className="vh-cart-lines">
            {items.map(item => (
              <article className="vh-cart-line" key={item.variantId}>
                <div className="vh-cart-line-media">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <span aria-hidden="true">VH</span>}
                </div>
                <div className="vh-cart-line-info">
                  <Link href={`/customer/products/${encodeURIComponent(item.handle)}`}><strong>{item.title}</strong></Link>
                  <span>{money(Number(item.price), item.currencyCode)} each</span>
                  <label>Quantity
                    <input type="number" min="1" max="20" step="1" value={item.quantity} onChange={event => updateQuantity(item.variantId, Number(event.target.value))} />
                  </label>
                  <button type="button" className="vh-cart-remove" onClick={() => removeItem(item.variantId)}>Remove</button>
                </div>
                <strong className="vh-cart-line-total">{money(Number(item.price) * item.quantity, item.currencyCode)}</strong>
              </article>
            ))}
          </div>
          <aside className="vh-cart-summary">
            <h2>Order summary</h2>
            {mixedCurrencies ? <p>Items use different currencies. Please review the products before checkout.</p> : <><div><span>Subtotal</span><strong>{money(subtotal, currency)}</strong></div><p>Shipping, taxes and any applicable duties are calculated by Shopify at checkout.</p></>}
            {error && <p role="alert" className="vh-store-message">{error}</p>}
            <button type="button" className="vh-button vh-button-dark" onClick={checkout} disabled={busy || mixedCurrencies}>{busy ? 'Opening secure checkout…' : 'Continue to secure checkout'}</button>
            <button type="button" className="vh-cart-clear" onClick={clearCart} disabled={busy}>Clear shopping bag</button>
            <Link href="/customer/categories" className="vh-back-link">← Continue shopping</Link>
          </aside>
        </section>
      )}
      <CustomerBottomNav />
    </main>
  );
}
