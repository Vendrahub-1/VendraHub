import Image from 'next/image';
import Link from 'next/link';
import CustomerBottomNav from '@/components/storefront/customer-bottom-nav';
import CustomerSidebar from '@/components/storefront/customer-sidebar';

const statuses = ['All orders', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returns & refunds'];
const orderAreas = [
  { title: 'Order details', text: 'Order number, purchased products, quantities, discounts, subtotal and total.' },
  { title: 'Payment information', text: 'Payment method, transaction reference, payment status and receipt.' },
  { title: 'Delivery and tracking', text: 'Delivery address, courier details, dispatch updates and tracking history.' },
  { title: 'Cancellations', text: 'Cancellation requests and the latest status for eligible orders.' },
  { title: 'Returns and refunds', text: 'Return requests, refund applications, decisions and refund progress.' },
  { title: 'Order support', text: 'Report a problem or contact support about a specific purchase.' },
];

export default function CustomerOrdersPage() {
  return (
    <main className="vh-store vh-orders-page">
      <header className="vh-store-header">
        <Link href="/customer" className="vh-store-brand"><Image src="/vendrahub-logo.svg" alt="VendraHub" width={220} height={64} priority /></Link>
        <CustomerSidebar />
      </header>
      <section className="vh-orders-hero"><p className="vh-overline">YOUR PURCHASES</p><h1>Every order,<br/><em>in one place.</em></h1><p>Review purchases, follow delivery progress, manage eligible cancellations and request returns or refunds.</p></section>
      <section aria-label="Order status filters" className="vh-order-status-list">{statuses.map(status => <span key={status}>{status}</span>)}</section>
      <section className="vh-order-empty"><strong>Your orders will appear here.</strong><p>We are not showing sample orders or invented tracking updates. Your order history will load here when the secure Shopify customer-order connection is enabled.</p><Link href="/customer/categories" className="vh-button vh-button-dark">Browse products →</Link></section>
      <section className="vh-order-capabilities" aria-label="Order information available here">{orderAreas.map(area => <article key={area.title}><strong>{area.title}</strong><p>{area.text}</p></article>)}</section>
      <CustomerBottomNav active="Orders" />
    </main>
  );
}
