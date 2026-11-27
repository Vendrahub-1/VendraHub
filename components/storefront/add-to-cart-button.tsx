'use client';

import { useState } from 'react';
import { useVendraCart } from '@/components/storefront/cart-provider';

export default function AddToCartButton({
  product,
  available,
}: {
  product: {
    id: string;
    handle: string;
    title: string;
    imageUrl: string | null;
    price: string;
    currencyCode: string;
    variantId: string | null;
  };
  available: boolean;
}) {
  const { addItem } = useVendraCart();
  const [added, setAdded] = useState(false);

  function add() {
    if (!product.variantId || !available) return;
    addItem({
      variantId: product.variantId,
      productId: product.id,
      handle: product.handle,
      title: product.title,
      imageUrl: product.imageUrl,
      price: product.price,
      currencyCode: product.currencyCode,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button type="button" className="vh-button vh-button-dark" onClick={add} disabled={!product.variantId || !available}>
      {added ? 'Added to bag ✓' : available && product.variantId ? 'Add to bag' : 'Unavailable'}
    </button>
  );
}
