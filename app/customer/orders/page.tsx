'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CustomerBottomNav from '@/components/storefront/customer-bottom-nav';

type Order = {
  id: string; name: string; createdAt: string; cancelledAt: string | null; financialStatus: string; fulfillmentStatus: string;
  total: { amount: string; currencyCode: string };
  items: Array<{ title: string; quantity: number; variant: { title: string } | null }>;
  fulfillments: Array<{ createdAt: string; status: string | null; tracking: Array<{ company: string | null; number: string | null; url: string | null }> }>;
};

const statuses = ['All orders', 'Unfulfilled', 'In progress', 'Fulfilled', 'Cancelled'];
const pretty = (value: string) => value.toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('All orders');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/customer/orders', { cache: 'no-store' })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not load orders.'); if (active) setOrders(data.orders ?? []); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load order history.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visible = orders.filter(order => {
    if (filter === 'All orders') return true;
    if (filter === 'Unfulfilled') return !order.cancelledAt && ['UNFULFILLED', 'PENDING_FULFILLMENT', 'OPEN'].includes(order.fulfillmentStatus);
    if (filter === 'In progress') return !order.cancelledAt && ['IN_PROGRESS', 'PARTIALLY_FULFILLED', 'SCHEDULED'].includes(order.fulfillmentStatus);
    if (filter === 'Fulfilled') return !order.cancelledAt && order.fulfillmentStatus === 'FULFILLED';
    return Boolean(order.cancelledAt);
  });

  return (
    <main className="vh-store vh-orders-page">
      <header className="vh-store-header"><Link href="/customer" className="vh-store-brand"><Image src="/vendrahub-logo.svg" alt="VendraHub" width={220} height={64} priority /></Link></header>
      <section className="vh-orders-hero"><p className="vh-overline">YOUR PURCHASES</p><h1>Every order,<br/><em>in one place.</em></h1><p>View your Shopify purchases, payment status and real fulfilment tracking updates.</p></section>
      <nav aria-label="Order status filters" className="vh-order-status-list">{statuses.map(status => <button type="button" key={status} aria-pressed={filter === status} className={filter === status ? 'is-active' : ''} onClick={() => setFilter(status)}>{status}</button>)}</nav>
      {loading && <div className="vh-store-message">Loading your order history…</div>}
      {error && <div className="vh-order-empty" role="alert"><strong>We could not load your orders.</strong><p>{error}</p><Link href="/customer/login" className="vh-button vh-button-dark">Sign in</Link></div>}
      {!loading && !error && visible.length === 0 && <section className="vh-order-empty"><strong>{orders.length ? 'No orders in this category.' : 'No Shopify orders found for this account.'}</strong><p>{orders.length ? 'Choose another status filter to see your purchases.' : 'Orders placed using the same verified email address will appear here when they are available in Shopify.'}</p><Link href="/customer/categories" className="vh-button vh-button-dark">Browse products →</Link></section>}
      {!loading && !error && visible.length > 0 && <section className="vh-customer-orders-list">{visible.map(order => (
        <article className="vh-customer-order-card" key={order.id}>
          <header><div><strong>{order.name}</strong><small>Placed {new Date(order.createdAt).toLocaleDateString()}</small></div><span>{pretty(order.fulfillmentStatus)}</span></header>
          <div className="vh-customer-order-meta"><span>Payment: {pretty(order.financialStatus)}</span><strong>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: order.total.currencyCode }).format(Number(order.total.amount))}</strong></div>
          <ul>{order.items.map((item, index) => <li key={order.id + '-' + index}>{item.title}{item.variant?.title && item.variant.title !== 'Default Title' ? ' · ' + item.variant.title : ''} <span>× {item.quantity}</span></li>)}</ul>
          {order.fulfillments.map((fulfillment, index) => <div className="vh-order-tracking" key={order.id + '-fulfillment-' + index}>
            <strong>Shipment {index + 1}: {pretty(fulfillment.status || order.fulfillmentStatus)}</strong>
            {fulfillment.tracking.map((tracking, trackIndex) => <p key={trackIndex}>{tracking.company || 'Carrier'} {tracking.number ? '· ' + tracking.number : ''} {tracking.url && <a href={tracking.url} target="_blank" rel="noopener noreferrer">Track shipment ↗</a>}</p>)}
            {!fulfillment.tracking.length && <p>Fulfilment created; carrier tracking has not been supplied yet.</p>}
          </div>)}
          {!order.fulfillments.length && <p className="vh-order-tracking">Tracking will appear here once the order is fulfilled and the carrier details are supplied.</p>}
        </article>
      ))}</section>}
      <CustomerBottomNav active="Orders" />
    </main>
  );
}
