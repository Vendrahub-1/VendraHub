import Image from 'next/image';
import Link from 'next/link';
import CustomerBottomNav from '@/components/storefront/customer-bottom-nav';

export default function CustomerCartPage() {
  return (
    <main className="vh-store">
      <header className="vh-store-header">
        <Link href="/customer" className="vh-store-brand"><Image src="/vendrahub-logo.svg" alt="VendraHub" width={220} height={64} priority /></Link>
      </header>
      <section className="vh-secondary-hero vh-cart-hero">
        <p className="vh-overline">YOUR SELECTION</p><h1>Your shopping<br/><em>bag.</em></h1>
        <p>Your shopping bag is ready for the cart integration. Product purchases currently continue through Shopify's secure checkout from each product.</p>
        <Link href="/customer/categories" className="vh-button vh-button-dark">Explore products →</Link>
      </section>
      <section className="vh-cart-next"><strong>Shopping bag integration</strong><p>We are preparing a persistent multi-item cart. No items or totals are fabricated here.</p></section>
      <CustomerBottomNav />
    </main>
  );
}
