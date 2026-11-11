import Link from 'next/link';
import {
  searchShopifyProducts,
  ShopifyConfigurationError,
} from '@/lib/shopify';

export const dynamic = 'force-dynamic';

function formatPrice(amount: string, currency: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function CustomerPage() {
  let products = await searchShopifyProducts('', 20).catch((error: unknown) => {
    if (!(error instanceof ShopifyConfigurationError)) {
      console.error('Could not render Shopify products:', error);
    }
    return [];
  });
  const shopifyReady = Boolean(process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN);

  return (
    <main className="session-page customer-theme">
      <div className="topbar">
        <Link href="/" className="crumb-link">← Back to home</Link>
        <span className="session-pill">Customer storefront</span>
      </div>

      <section className="panel intro-panel">
        <div>
          <p className="eyebrow">VendraHub online store</p>
          <h1>Discover something you love.</h1>
          <p>Products and current pricing are loaded live from our Shopify storefront.</p>
        </div>
      </section>

      {!shopifyReady && (
        <p className="panel" role="status">
          Shopify is not connected yet. Add the server-side Storefront API token using the setup instructions in the README.
        </p>
      )}
      {shopifyReady && products.length === 0 && (
        <p className="panel" role="status">No products are available right now, or Shopify could not be reached.</p>
      )}

      <section className="product-grid" aria-label="Shopify products">
        {products.map((product) => (
          <article key={product.id} className="panel shop-product">
            {product.imageUrl ? (
              // Shopify-hosted image URLs are external and configured by the store owner.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.imageAlt ?? product.title} />
            ) : <div className="product-placeholder" aria-hidden="true">VH</div>}
            <div className="shop-product-details">
              <h2>{product.title}</h2>
              <p>{product.description || 'Explore this product from VendraHub.'}</p>
              <strong>{formatPrice(product.price, product.currencyCode)}</strong>
              <span className={product.availableForSale ? 'availability available' : 'availability'}>
                {product.availableForSale ? 'Available' : 'Sold out'}
              </span>
            </div>
          </article>
        ))}
      </section>

      <p className="storefront-note">
        Product information is read-only. Checkout, customer accounts, and order history are not connected in this initial integration.
      </p>
    </main>
  );
}
