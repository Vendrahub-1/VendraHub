import Link from 'next/link';
import SignOutButton from '@/components/sign-out-button';
import SupplierHubPanel from '@/components/admin/supplier-hub-panel';
import SocialMediaPanel from '@/components/admin/social-media-panel';
import { createClient } from '@/lib/supabase/server';

const suppliers = [
  { code: 'syncee', name: 'Syncee AI Dropshipping', method: 'Shopify app · merchant-authorised', detail: 'Discover products from Syncee suppliers, then use Syncee’s own import and sync workflow in Shopify. VendraHub AI can analyse products after they are available in your store.', installUrl: 'https://apps.shopify.com/syncee-1', docsUrl: 'https://help.syncee.com/en/articles/8886065-how-to-install-syncee-to-your-shopify-store', mode: 'Shopify app' },
  { code: 'dsers', name: 'DSers', method: 'Shopify app · merchant-authorised', detail: 'Connect DSers to Shopify for AliExpress and supported supplier sourcing. Its app manages its own catalogue and product import workflow.', installUrl: 'https://apps.shopify.com/dsers', docsUrl: 'https://help.dsers.com/link-shopify-store/', mode: 'Shopify app' },
  { code: 'cjdropshipping', name: 'CJdropshipping', method: 'Shopify app + optional direct API', detail: 'Use the Shopify app for the merchant connection. The direct API path can support VendraHub AI catalogue search after the API credentials are verified.', installUrl: 'https://apps.shopify.com/cucheng', docsUrl: 'https://developers.cjdropshipping.com/en/api/start/apikey.html', mode: 'Shopify app + API' },
  { code: 'printful', name: 'Printful', method: 'Shopify app + direct API', detail: 'Connect Printful for print-on-demand products and fulfilment. The server-side API token can support catalogue lookups after verification.', installUrl: 'https://apps.shopify.com/printful', docsUrl: 'https://developers.printful.com/docs/', mode: 'Shopify app + API' },
];

const nav = [
  ['Overview', 'overview'], ['Products', 'products'], ['AI Product Discovery', 'product-discovery'], ['Orders', 'orders'], ['Customers', 'customers'],
  ['Suppliers', 'suppliers'], ['Inventory', 'inventory'], ['Sales & profit', 'finance'], ['Support', 'support'],
  ['AI assistant', 'assistant'], ['Social Media', 'social-media'], ['Staff & access', 'staff'], ['Notifications', 'notifications'],
  ['Reports', 'reports'], ['Settings', 'settings'],
] as const;

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return <section id={id} className="admin-section"><div className="section-heading"><div><p className="admin-kicker">MANAGEMENT</p><h2>{title}</h2><p>{description}</p></div></div>{children}</section>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="admin-empty"><span className="empty-mark">—</span><strong>{title}</strong><p>{detail}</p></div>;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const [ticketsResult, auditResult, supplierResult] = await Promise.all([
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }),
    supabase.from('audit_events').select('id', { count: 'exact', head: true }),
    supabase.from('supplier_connections').select('supplier_code, connection_status').order('supplier_code'),
  ]);
  const supplierStatuses = new Map<string, string>((supplierResult.data ?? []).map(item => [item.supplier_code, item.connection_status] as [string, string]));
  const supplierCount = supplierResult.data?.length ?? 0;
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
            {[
              { label: 'Support requests', value: String(ticketsResult.count ?? 0), note: 'Customer tickets in Supabase' },
              { label: 'Supplier records', value: String(supplierCount), note: 'Connection state only; not connected' },
              { label: 'Audit events', value: String(auditResult.count ?? 0), note: 'Recorded privileged events' },
              { label: 'Live operations', value: 'Paused', note: 'Purchases, imports and payments disabled' },
            ].map(metric => <article className="metric-card" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article>)}
          </div>

          <div className="overview-grid">
            <article className="admin-card"><div className="card-heading"><div><h3>Business activity</h3><p>Sales and order activity will display here</p></div><span className="muted-tag">NO DATA</span></div><EmptyState title="Analytics not connected" detail="Connect authenticated Shopify and reporting services to populate this area." /></article>
            <article className="admin-card"><div className="card-heading"><div><h3>Launch readiness</h3><p>Current implementation checkpoints</p></div></div><ul className="readiness-list"><li><span>Admin authentication</span><b className="state state-warning">Owner MFA enforced</b></li><li><span>Database and access policies</span><b className="state state-warning">RLS enabled</b></li><li><span>Shopify Admin API</span><b className="state">Not verified</b></li><li><span>Supplier connections</span><b className="state">Pending</b></li><li><span>Live operations</span><b className="state state-paused">Disabled</b></li></ul></article>
          </div>

          <Section id="products" title="Products" description="Store product catalogue and products already approved for the VendraHub storefront.">
            <div className="admin-card"><div className="card-heading"><div><h3>Store catalogue</h3><p>Supplier discovery results remain separate from live Shopify products until an owner approves an import.</p></div><span className="muted-tag">IMPORT REVIEW REQUIRED</span></div><EmptyState title="Store catalogue view is being connected" detail="The AI Product Discovery workspace below searches supplier catalogues without publishing products." /></div>
          </Section>
          <Section id="product-discovery" title="AI Product Discovery" description="Search supplier catalogues, compare source costs and product details, and prepare selected products for owner-reviewed import.">
            <SupplierHubPanel initialStatuses={Object.fromEntries(supplierStatuses)} mode="catalogue" />
            <p className="admin-footnote">Current catalogue search is read-only. AI ranking, landed-cost verification, variant-level shipping comparison and Shopify draft import are separate implementation steps. No product is imported or published automatically.</p>
          </Section>

          <Section id="orders" title="Orders" description="Order review, status, payment reconciliation, returns and fulfilment.">
            <div className="admin-card"><div className="card-heading"><h3>Order management</h3><span className="state state-paused">Live actions disabled</span></div><EmptyState title="Order management is not connected" detail="Connect a properly authorised Shopify Admin API service before displaying or changing live orders." /></div>
          </Section>

          <Section id="customers" title="Customers" description="Customer profiles, order history, support context and privacy requests.">
            <div className="admin-card"><EmptyState title="Customer data is not connected" detail="Customer information will only be available through appropriately scoped, authenticated Shopify access." /></div>
          </Section>

          <Section id="suppliers" title="Supplier Hub" description="Install supplier apps, verify direct API authentication and browse available supplier catalogues.">
            <SupplierHubPanel initialStatuses={Object.fromEntries(supplierStatuses)} mode="connections" />
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

          <Section id="social-media" title="Social Media Management" description="Platform connections, channel-specific content, owner approvals and publishing controls.">
            <SocialMediaPanel />
          </Section>

          <Section id="staff" title="Staff & access" description="Administrator identity, staff roles, permissions and audit history.">
            <div className="admin-card"><EmptyState title="Owner access protected" detail="Owner access is checked server-side; verified email and AAL2 MFA are required. Staff roles remain disabled until explicitly configured." /></div>
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
