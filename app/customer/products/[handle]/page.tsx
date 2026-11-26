import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CheckoutButton from '@/components/storefront/checkout-button';
import CustomerBottomNav from '@/components/storefront/customer-bottom-nav';
import CustomerSidebar from '@/components/storefront/customer-sidebar';
import { searchShopifyProducts, ShopifyConfigurationError } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

function formatPrice(amount: string, currency: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export default async function CustomerProductDetail({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  let product = null;
  try {
    const products = await searchShopifyProducts('', 20);
    product = products.find(item => item.handle === handle) ?? null;
  } catch (error) {
    if (!(error instanceof ShopifyConfigurationError)) console.error('Product detail lookup failed:', error);
  }
  if (!product) notFound();

  return (
    <main className="vh-store vh-product-detail-page">
      <header className="vh-store-header">
        <Link href="/customer" className="vh-store-brand"><Image src="/vendrahub-logo.svg" alt="VendraHub" width={220} height={64} priority /></Link>
        <CustomerSidebar />
      </header>
      <p className="vh-breadcrumb"><Link href="/customer">Home</Link> / <Link href="/customer/categories">Shop</Link> / {product.title}</p>
      <section className="vh-product-detail">
        <div className="vh-product-detail-media">
          {product.imageUrl ? <img src={product.imageUrl} alt={product.imageAlt ?? product.title} /> : <div className="vh-product-no-image">VH</div>}
        </div>
        <div className="vh-product-detail-copy">
          <p className="vh-overline">THE VENDRAHUB COLLECTION</p>
          <h1>{product.title}</h1>
          <strong className="vh-product-detail-price">{formatPrice(product.price, product.currencyCode)}</strong>
          <p>{product.description || 'A considered pick from the VendraHub fashion and lifestyle collection.'}</p>
          <span className={product.availableForSale ? 'vh-stock vh-in-stock' : 'vh-stock'}>{product.availableForSale ? 'Available to purchase' : 'Currently sold out'}</span>
          <CheckoutButton variantId={product.variantId} available={product.availableForSale} />
          <p className="vh-product-detail-note">Secure payment is completed through Shopify checkout.</p>
          <Link href="/customer/categories" className="vh-back-link">← Continue browsing</Link>
        </div>
      </section>
      <CustomerBottomNav active="Categories" />
    </main>
  );
}
