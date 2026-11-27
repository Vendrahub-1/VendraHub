import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductPurchasePanel from '@/components/storefront/product-purchase-panel';
import WishlistButton from '@/components/storefront/wishlist-button';
import CustomerBottomNav from '@/components/storefront/customer-bottom-nav';
import { getShopifyProductByHandle, ShopifyConfigurationError } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

export default async function CustomerProductDetail({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  let product = null;
  try {
    product = await getShopifyProductByHandle(handle);
  } catch (error) {
    if (!(error instanceof ShopifyConfigurationError)) console.error('Product detail lookup failed:', error);
  }
  if (!product) notFound();

  return (
    <main className="vh-store vh-product-detail-page">
      <header className="vh-store-header">
        <Link href="/customer" className="vh-store-brand"><Image src="/vendrahub-logo.svg" alt="VendraHub" width={220} height={64} priority /></Link>
      </header>
      <p className="vh-breadcrumb"><Link href="/customer">Home</Link> / <Link href="/customer/categories">Shop</Link> / {product.title}</p>
      <section className="vh-product-detail">
        <div className="vh-product-detail-media">
          {product.imageUrl ? <img src={product.imageUrl} alt={product.imageAlt ?? product.title} /> : <div className="vh-product-no-image">VH</div>}
        </div>
        <div className="vh-product-detail-copy">
          <p className="vh-overline">THE VENDRAHUB COLLECTION</p>
          <h1>{product.title}</h1>
          <p>{product.description || 'A considered pick from the VendraHub fashion and lifestyle collection.'}</p>
          <span className={product.availableForSale ? 'vh-stock vh-in-stock' : 'vh-stock'}>{product.availableForSale ? 'Available to purchase' : 'Currently sold out'}</span>
          <ProductPurchasePanel product={product} checkoutEnabled={process.env.NEXT_PUBLIC_CHECKOUT_ENABLED === 'true'} />
          <p className="vh-product-detail-note">Payment checkout is paused while we finish testing the VendraHub platform.</p>
          <Link href="/customer/categories" className="vh-back-link">← Continue browsing</Link>
        </div>
      </section>
      <CustomerBottomNav active="Categories" />
    </main>
  );
}
