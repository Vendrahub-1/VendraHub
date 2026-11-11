import Link from 'next/link';
import SignOutButton from '@/components/sign-out-button';

const suppliers = [
  { name: 'Syncee', method: 'Shopify app authorisation', status: 'Awaiting authorisation', detail: 'Install Syncee from Shopify Admin and complete its merchant-authorised connection.', url: 'https://admin.shopify.com/store/vendrahub-store/apps', docs: 'https://help.syncee.com/en/articles/8886065-how-to-install-syncee-to-your-shopify-store' },
  { name: 'DSers', method: 'Shopify app authorisation', status: 'Awaiting authorisation', detail: 'Install DSers from Shopify Admin and link the VendraHub store.', url: 'https://admin.shopify.com/store/vendrahub-store/apps', docs: 'https://help.dsers.com/link-shopify-store/' },
  { name: 'CJdropshipping', method: 'Shopify app or optional direct API', status: process.env.CJ_API_KEY ? 'Credential present · unverified' : 'Not connected', detail: 'A configured key is not proof of a working API connection. Keep all credentials server-side.', url: 'https://www.cjdropshipping.com/my.html#/authorize/API', docs: 'https://developers.cjdropshipping.com/en/api/start/apikey.html' },
];

const nav = [
  ['Overview', 'overview'], ['Products', 'products'], ['Orders', 'orders'], ['Customers', 'customers'],
  ['Suppliers', 'suppliers'], ['Inventory', 'inventory'], ['Sales & profit', 'finance'], ['Support', 'support'],
  ['AI assistant', 'assistant'], ['Staff & access', 'staff'], ['Notifications', 'notifications'],
  ['Reports', 'reports'], ['Settings', 'settings'],
] as const;

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return <section id={id} className="admin-section"><div className="section-heading"><div><p className="admin-kicker">MANAGEMENT</p><h2>{title}</h2><p>{description}</p></div></div>{children}</section>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="admin-empty"><span className="empty-mark">—</span><strong>{title}</strong><p>{detail}</p></div>;
}

export default function AdminPage() {
  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand"><span className="brand-mark">V</span><span><strong>VendraHub</strong><small>ADMIN CONSOLE</small></span></Link>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Admin navigation" className="admin-nav">
          {nav.map(([label, id], index) => <a key={id} href={'#' + id} className={index === 0 ? 'active' : ''}><span className="nav-dot">{String(index + 1).padStart(2, '0')}</span>{label}</a>)}
        </nav>
        <div className="sidebar-bottom"><span className="status-dot" /> Protected owner session <small>Authenticator verification required</small><Link href="/">← Store home</Link></div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar"><div><span className="topbar-overline">VENDRAHUB / ADMIN</span><strong>Store control center</strong></div><div className="topbar-actions"><span className="preview-chip">OWNER WORKSPACE</span><SignOutButton /><a href="https://admin.shopify.com/store/vendrahub-store" target="_blank" rel="noreferrer">Shopify Admin ↗</a></div></header>
        <div className="admin-content">
          <section id="overview" className="admin-welcome"><div><p className="admin-kicker">MORE CHOICE. BETTER LIVING.</p><h1>Good day. <span>Here is your store overview.</span></h1><p>Your administration workspace. Live business figures will appear when authenticated data services are connected.</p></div><div className="welcome-date">VENDRAHUB<br/><strong>ADMINISTRATION</strong></div></section>

          <div className="admin-alert"><span className="alert-icon">!</span><div><strong>Protected owner workspace — operational integrations remain read-only</strong><p>Only the verified owner session with authenticator-based MFA can access this console. Supplier purchases, imports, live inventory changes, payments and fulfilment actions remain disabled.</p></div></div>

          <div className="admin-metrics">
            {['Total sales', 'Orders', 'Products', 'Estimated profit'].map(label => <article className="metric-card" key={label}><span>{label}</span><strong>—</strong><small>Awaiting verified data connection</small></article>)}
          </div>

          <div className="overview-grid">
            <article className="admin-card"><div className="card-heading"><div><h3>Business activity</h3><p>Sales and order activity will display here</p></div><span className="muted-tag">NO DATA</span></div><EmptyState title="Analytics not connected" detail="Connect authenticated Shopify and reporting services to populate this area." /></article>
            <article className="admin-card"><div className="card-heading"><div><h3>Launch readiness</h3><p>Current implementation checkpoints</p></div></div><ul className="readiness-list"><li><span>Admin authentication</span><b className="state state-warning">Owner MFA enforced</b></li><li><span>Database and access policies</span><b className="state state-warning">RLS enabled</b></li><li><span>Shopify Admin API</span><b className="state">Not verified</b></li><li><span>Supplier connections</span><b className="state">Pending</b></li><li><span>Live operations</span><b className="state state-paused">Disabled</b></li></ul></article>
          </div>

          <Section id="products" title="Products" description="Catalogue, variants, pricing, product approval and publication.">
            <div className="admin-card"><div className="card-heading"><div><h3>Product catalogue</h3><p>Product data is not yet connected to an authenticated admin service.</p></div><span className="muted-tag">READINESS ONLY</span></div><EmptyState title="No admin catalogue loaded" detail="The existing storefront product endpoint is read-only. Product imports and publishing remain disabled pending approval." /></div>
          </Section>

          <Section id="orders" title="Orders" description="Order review, status, payment reconciliation, returns and fulfilment.">
            <div className="admin-card"><div className="card-heading"><h3>Order management</h3><span className="state state-paused">Live actions disabled</span></div><EmptyState title="Order management is not connected" detail="Connect a properly authorised Shopify Admin API service before displaying or changing live orders." /></div>
          </Section>

          <Section id="customers" title="Customers" description="Customer profiles, order history, support context and privacy requests.">
            <div className="admin-card"><EmptyState title="Customer data is not connected" detail="Customer information will only be available through appropriately scoped, authenticated Shopify access." /></div>
          </Section>

          <Section id="suppliers" title="Supplier connections" description="Compare suppliers, inspect connection health and review sourcing options.">
            <div className="supplier-grid">{suppliers.map(s => <article className="admin-card supplier-card" key={s.name}><div className="supplier-title"><div><h3>{s.name}</h3><small>{s.method}</small></div><span className={s.status.includes('present') ? 'state state-warning' : 'state'}>{s.status}</span></div><p>{s.detail}</p><div className="supplier-links"><a href={s.url} target="_blank" rel="noreferrer">Open connection page ↗</a><a href={s.docs} target="_blank" rel="noreferrer">Official guide ↗</a></div></article>)}</div>
            <div className="admin-note"><strong>Supplier operating policy</strong><p>Compare all three before selecting a primary supplier. Product imports, paid plans, supplier purchases, live stock changes and supplier order submission remain disabled until separately approved.</p></div>
          </Section>

          <Section id="inventory" title="Inventory & fulfilment" description="Supplier stock, SKU mapping, delivery estimates and shipment tracking.">
            <div className="admin-card"><EmptyState title="Inventory synchronisation is not active" detail="No live stock changes or automatic fulfilment are enabled. Supplier data must be verified before use." /></div>
          </Section>

          <Section id="finance" title="Sales & profit" description="Revenue, supplier costs, shipping, fees, refunds and currency reporting.">
            <div className="admin-card"><EmptyState title="Financial reporting awaits verified data" detail="No sales or profit figures are fabricated. Reports require reconciled Shopify and supplier cost data." /></div>
          </Section>

          <Section id="support" title="Customer support" description="Enquiries, returns, complaints, ticket ownership and resolution history.">
            <div className="admin-card"><EmptyState title="Support inbox not connected" detail="A support channel and ticket storage service are required before customer conversations can appear here." /></div>
          </Section>

          <Section id="assistant" title="AI operations assistant" description="Research, compare, explain and prepare actions for administrator review.">
            <div className="admin-card"><div className="card-heading"><h3>AI assistance policy</h3><span className="state state-paused">Approval required</span></div><ul className="feature-list"><li>Supplier comparison and sourcing summaries</li><li>Draft product descriptions and catalogue recommendations</li><li>Sales explanations and operational anomaly summaries</li><li>Prepare changes for human review</li></ul><p className="admin-footnote">AI does not independently import products, purchase subscriptions, place supplier orders, change live inventory or issue refunds.</p></div>
          </Section>

          <Section id="staff" title="Staff & access" description="Administrator identity, staff roles, permissions and audit history.">
            <div className="admin-card"><EmptyState title="Access management not configured" detail="Production use requires server-enforced authentication, role-based permissions, MFA and audit logging." /></div>
          </Section>

          <Section id="notifications" title="Notifications" description="Order events, supplier errors, stock alerts, payment events and security notices.">
            <div className="admin-card"><EmptyState title="Notification services not connected" detail="Notifications require verified event sources, delivery configuration and retry handling." /></div>
          </Section>

          <Section id="reports" title="Reports & analytics" description="Sales by period, country, product, supplier, returns and fulfilment performance.">
            <div className="admin-card"><EmptyState title="No verified reports available" detail="Reporting will be enabled after data ingestion, currency handling and reconciliation are implemented." /></div>
          </Section>

          <Section id="settings" title="Settings & system health" description="Store configuration, integration settings, security and operational diagnostics.">
            <div className="settings-grid"><article className="admin-card"><h3>Store configuration</h3><p>Store domain</p><strong>vendrahub-store.myshopify.com</strong><p>Reporting base currency</p><strong>NGN · subject to Shopify configuration verification</strong></article><article className="admin-card"><h3>Security controls</h3><ul className="feature-list"><li>Keep API secrets server-side only</li><li>Enforce admin authentication before production</li><li>Use least-privilege API scopes</li><li>Log privileged actions</li><li>Back up data and test restoration</li></ul></article></div>
          </Section>

          <footer className="admin-footer"><span>VendraHub · Admin workspace</span><span>Black · White · Gold</span></footer>
        </div>
      </div>
    </main>
  );
}
