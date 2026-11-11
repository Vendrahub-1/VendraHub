import Link from 'next/link';

const suppliers = [
  {
    name: 'Syncee',
    method: 'Shopify app + merchant OAuth',
    status: 'Awaiting Shopify authorisation',
    detail: 'Syncee connects through its Shopify app. It does not require us to collect a retailer API token for this app-first setup.',
    url: 'https://admin.shopify.com/store/vendrahub-store/apps',
    linkLabel: 'Open Shopify Apps',
    docs: 'https://help.syncee.com/en/articles/8886065-how-to-install-syncee-to-your-shopify-store',
  },
  {
    name: 'DSers',
    method: 'Shopify app + merchant OAuth',
    status: 'Awaiting Shopify authorisation',
    detail: 'DSers links the store through Shopify app authorisation. A separate DSers developer API application is not required for the standard store-owner workflow.',
    url: 'https://admin.shopify.com/store/vendrahub-store/apps',
    linkLabel: 'Open Shopify Apps',
    docs: 'https://help.dsers.com/link-shopify-store/',
  },
  {
    name: 'CJdropshipping',
    method: 'Shopify app or server-side CJ API',
    status: process.env.CJ_API_KEY ? 'API key configured — verification pending' : 'API key not configured',
    detail: 'The direct API path uses a CJ API key to obtain access tokens. Keep the key and all returned tokens in the deployment secret manager; never place them in browser code or Git.',
    url: 'https://www.cjdropshipping.com/my.html#/authorize/API',
    linkLabel: 'Open CJ API settings',
    docs: 'https://developers.cjdropshipping.com/en/api/start/apikey.html',
  },
];

const areas = [
  {
    title: 'Storefront connection',
    status: 'Not verified',
    detail: 'Shopify storefront credentials and API connection have not been verified in this deployment.',
  },
  {
    title: 'Product catalogue',
    status: 'Read-only preview',
    detail: 'The existing product endpoint is read-only. No products are imported.',
  },
  {
    title: 'Orders and fulfilment',
    status: 'Disabled',
    detail: 'Supplier order submission, fulfilment, returns and shipment updates remain disabled.',
  },
  {
    title: 'Payments and subscriptions',
    status: 'Disabled',
    detail: 'No paid supplier plans, supplier purchases or payment activation is enabled.',
  },
  {
    title: 'Staff and permissions',
    status: 'Not configured',
    detail: 'A production admin authentication and role-based access boundary is still required.',
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
            Integration setup and readiness. A displayed configuration state is
            not proof that a supplier account has completed OAuth or API verification.
          </p>
        </div>
      </section>

      <section className="panel" aria-labelledby="suppliers-heading">
        <h2 id="suppliers-heading">Supplier connections</h2>
        <p>
          Connect suppliers through their official Shopify authorisation flows.
          Direct API credentials are only used where the supplier documents that API.
        </p>
        <div className="content-grid">
          {suppliers.map((supplier) => (
            <article key={supplier.name} className="stat-card">
              <span>{supplier.name}</span>
              <strong>{supplier.status}</strong>
              <p>{supplier.method}</p>
              <p>{supplier.detail}</p>
              <p><a href={supplier.url} target="_blank" rel="noreferrer">{supplier.linkLabel}</a></p>
              <p><a href={supplier.docs} target="_blank" rel="noreferrer">Official connection guide</a></p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="readiness-heading">
        <h2 id="readiness-heading">Platform integration readiness</h2>
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
        <h2>Security and operating controls</h2>
        <ul className="stack-list">
          <li>Supplier credentials must be stored as server-side deployment secrets.</li>
          <li>Never paste API keys or access tokens into chat, source code, or NEXT_PUBLIC variables.</li>
          <li>Product imports remain disabled pending product-by-product approval.</li>
          <li>Paid supplier subscriptions and supplier purchases remain disabled.</li>
          <li>Live order submission, inventory updates and fulfilment automation remain disabled.</li>
          <li>AI-assisted actions are draft and review only.</li>
        </ul>
      </section>
    </main>
  );
}
