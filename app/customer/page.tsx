import Image from 'next/image';
import Link from 'next/link';
import CheckoutButton from '@/components/storefront/checkout-button';
import { searchShopifyProducts, ShopifyConfigurationError } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

type CustomerPageProps = { searchParams: Promise<{ q?: string }> };

function formatPrice(amount: string, currency: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export default async function CustomerPage({ searchParams }: CustomerPageProps) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  let productsUnavailable = false;
  const products = await searchShopifyProducts(query, 20).catch((error: unknown) => {
    if (!(error instanceof ShopifyConfigurationError)) {
      productsUnavailable = true;
      console.error('Could not render Shopify products:', error instanceof Error ? error.message : String(error));
    }
    return [];
  });
  const shopifyReady = Boolean(
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN || process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN_1,
  );

  return (
    <main className="vh-store">
      <header className="vh-store-header">
        <Link href="/" className="vh-store-brand" aria-label="VendraHub home"><Image src="/vendrahub-logo.svg" alt="VendraHub" width={220} height={64} priority /></Link>
        <nav aria-label="Store navigation"><Link href="/customer">Shop</Link><Link href="/customer/account">My account</Link><Link href="/customer/login" className="vh-store-signin">Sign in</Link></nav>
      </header>

      <section className="vh-store-hero">
        <div><p className="vh-overline">THE VENDRAHUB COLLECTION</p><h1>Style starts<br /><em>with you.</em></h1><p>Discover the pieces currently available in our live store. Real product details and prices come directly from Shopify.</p><Link href="#collection" className="vh-button vh-button-dark">Explore products <span aria-hidden="true">↓</span></Link></div>
        <div className="vh-store-hero-art"><span>VH</span><small>SHOP SMART.<br />LIVE STYLISH.</small></div>
      </section>

      <section id="collection" className="vh-collection">
        <div className="vh-collection-heading"><div><p className="vh-overline">SHOP VENDRAHUB</p><h2>{query ? `Results for “${query}”` : 'The live collection'}</h2><p>Product availability and pricing are synced from Shopify.</p></div><form action="/customer" method="get" className="vh-search"><label className="vh-visually-hidden" htmlFor="store-search">Search products</label><input id="store-search" name="q" type="search" defaultValue={query} placeholder="Search products..." /><button type="submit" aria-label="Search products">Search ↗</button></form></div>

        {!shopifyReady && <div className="vh-store-message" role="status">Shopify storefront credentials are not configured. Add the server-side Storefront API token to enable live products.</div>}
        {shopifyReady && productsUnavailable && <div className="vh-store-message" role="status">We’re having trouble connecting to Shopify right now. Please try again shortly.</div>}
        {shopifyReady && !productsUnavailable && products.length === 0 && <div className="vh-store-message" role="status">{query ? 'No matching products were found. Try another search.' : 'There are no active products available right now.'}</div>}

        <div className="vh-product-grid">
          {products.map((product, index) => (
            <article key={product.id} className="vh-product-card">
              <div className="vh-product-media">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.imageAlt ?? product.title} loading={index < 4 ? 'eager' : 'lazy'} />
                ) : <div className="vh-product-no-image" aria-hidden="true">VH</div>}
                <span className={product.availableForSale ? 'vh-stock vh-in-stock' : 'vh-stock'}>{product.availableForSale ? 'Available' : 'Sold out'}</span>
              </div>
              <div className="vh-product-info"><h3>{product.title}</h3><p>{product.description || 'A VendraHub collection pick.'}</p><strong>{formatPrice(product.price, product.currencyCode)}</strong><CheckoutButton variantId={product.variantId} available={product.availableForSale} /></div>
            </article>
          ))}
        </div>
      </section>

      <footer className="vh-store-footer"><Link href="/">VendraHub</Link><span>Secure checkout powered by Shopify</span><Link href="/customer/account">Your account →</Link></footer>
    </main>
  );
}
