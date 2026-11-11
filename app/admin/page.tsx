import Link from 'next/link';

const areas = [
  {
    title: 'Storefront connection',
    status: 'Not configured',
    detail: 'Shopify credentials and Storefront API connection have not been verified.',
  },
  {
    title: 'Product catalogue',
    status: 'Read-only preview',
    detail: 'Product discovery is available through the configured API route when credentials are supplied. No products are imported.',
  },
  {
    title: 'Orders and fulfilment',
    status: 'Not connected',
    detail: 'Live orders, fulfilment, returns and shipment updates are not connected.',
  },
  {
    title: 'Suppliers',
    status: 'Comparison pending',
    detail: 'Compare Syncee, DSers and one additional supplier before selecting a first provider.',
  },
  {
    title: 'Payments and subscriptions',
    status: 'Disabled',
    detail: 'No payment activation, paid supplier subscription or live order processing is enabled.',
  },
  {
    title: 'Staff and permissions',
    status: 'Not configured',
    detail: 'No staff accounts or role-based access controls are connected.',
  },
];

export default function AdminPage() {
  return (
    <main className="session-page admin-theme">
      <div className="topbar">
        <Link href="/" className="crumb-link">← Back to home</Link>
        <span className="session-pill">Admin preview</span>
      </div>

      <section className="panel intro-panel">
        <div>
          <p className="eyebrow">VendraHub · More Choice. Better Living.</p>
          <h1>Store control center</h1>
          <p>
            Development overview. This page does not represent live store activity
            or verified operational data.
          </p>
        </div>
      </section>

      <section className="panel" aria-labelledby="readiness-heading">
        <h2 id="readiness-heading">Integration readiness</h2>
        <p>
          The application foundation is present, but production connections must
          be configured and tested before this dashboard can display live data.
        </p>
        <div className="content-grid">
          {areas.map((area) => (
            <article key={area.title} className="stat-card">
              <span>{area.title}</span>
              <strong>{area.status}</strong>
              <p>{area.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Safety controls</h2>
        <ul className="stack-list">
          <li>Product imports: disabled pending explicit approval.</li>
          <li>Paid supplier subscriptions: disabled pending explicit approval.</li>
          <li>Live order processing and fulfilment: disabled.</li>
          <li>Payment activation: disabled.</li>
          <li>AI-assisted actions: draft and review only; no autonomous store changes.</li>
        </ul>
      </section>
    </main>
  );
}
