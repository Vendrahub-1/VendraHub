'use client';

import { useMemo, useState } from 'react';
import { useVendraCart } from '@/components/storefront/cart-provider';
import WishlistButton from '@/components/storefront/wishlist-button';

type Variant = { id: string; title: string; availableForSale: boolean; price: string; currencyCode: string; selectedOptions: Array<{ name: string; value: string }> };
type Product = { id: string; handle: string; title: string; imageUrl: string | null; price: string; currencyCode: string; variantId: string | null; variants: Variant[] };

function formatPrice(amount: string, currency: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount + ' ' + currency;
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export default function ProductPurchasePanel({ product }: { product: Product }) {
  const { addItem } = useVendraCart();
  const variants = product.variants ?? [];
  const [selectedId, setSelectedId] = useState(product.variantId ?? variants[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const selected = useMemo(() => variants.find(variant => variant.id === selectedId) ?? null, [variants, selectedId]);
  const available = selected ? selected.availableForSale : Boolean(product.variantId);
  const price = selected?.price ?? product.price;
  const currency = selected?.currencyCode ?? product.currencyCode;

  function add() {
    if (!selectedId || !available) return;
    addItem({ variantId: selectedId, productId: product.id, handle: product.handle, title: product.title + (selected?.title && selected.title !== 'Default Title' ? ' — ' + selected.title : ''), imageUrl: product.imageUrl, price, currencyCode: currency }, quantity);
    setNotice('Added to your shopping bag.');
  }

  async function buyNow() {
    if (!selectedId || !available) return;
    setNotice('');
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lines: [{ merchandiseId: selectedId, quantity }] }) });
      const data = await response.json();
      if (!response.ok || typeof data.checkoutUrl !== 'string') throw new Error(data.error || 'Checkout could not be started.');
      const url = new URL(data.checkoutUrl);
      if (url.protocol !== 'https:' || !url.hostname.endsWith('.myshopify.com')) throw new Error('Shopify returned an invalid checkout address.');
      window.location.assign(url.toString());
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Checkout could not be started.'); }
  }

  return <div className="vh-product-purchase-panel">
    {variants.length > 1 && <label className="vh-variant-label">Choose an option
      <select value={selectedId} onChange={event => { setSelectedId(event.target.value); setNotice(''); }}>
        {variants.map(variant => <option key={variant.id} value={variant.id} disabled={!variant.availableForSale}>{variant.title}{variant.availableForSale ? '' : ' — Sold out'}</option>)}
      </select>
    </label>}
    <strong className="vh-product-detail-price">{formatPrice(price, currency)}</strong>
    <label className="vh-quantity-label">Quantity
      <input type="number" min={1} max={20} value={quantity} onChange={event => setQuantity(Math.min(20, Math.max(1, Number(event.target.value) || 1)))} />
    </label>
    <div className="vh-product-action-row">
      <button type="button" className="vh-button vh-button-dark" onClick={add} disabled={!available || !selectedId}>Add to bag</button>
      <button type="button" className="vh-button vh-button-outline" onClick={buyNow} disabled={!available || !selectedId}>Buy now</button>
    </div>
    <WishlistButton productId={product.id} />
    {notice && <p className="vh-product-action-feedback" role="status">{notice}</p>}
  </div>;
}
