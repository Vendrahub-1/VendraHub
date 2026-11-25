import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import AdminWorkspace from '@/components/admin/admin-workspace';
import { createClient } from '@/lib/supabase/server';

type Row = Record<string, string | number | null>;

const pageConfig: Record<string, { title: string; description: string; table?: string; columns?: { key: string; label: string }[]; orderBy?: string }> = {
  products: { title: 'Products', description: 'Catalogue, variants, pricing, product approval and publication.', table: 'products', columns: [{key:'title',label:'Product'},{key:'vendor',label:'Brand / vendor'},{key:'product_type',label:'Category'},{key:'status',label:'Status'}] },
  orders: { title: 'Orders', description: 'Review orders, payment status, returns and fulfilment.', table: 'orders', columns: [{key:'order_number',label:'Order'},{key:'currency',label:'Currency'},{key:'total',label:'Total'},{key:'payment_status',label:'Payment'},{key:'fulfillment_status',label:'Fulfilment'}] },
  customers: { title: 'Customers', description: 'Customer account totals and privacy-conscious account operations.', table: 'customers', columns: [{key:'first_name',label:'First name'},{key:'last_name',label:'Last name'},{key:'country',label:'Country'},{key:'customer_status',label:'Status'}] },
  suppliers: { title: 'Suppliers', description: 'Connection health, supplier catalogue and order readiness.', table: 'supplier_connections', columns: [{key:'supplier_code',label:'Supplier'},{key:'integration_method',label:'Connection method'},{key:'connection_status',label:'Status'},{key:'last_checked_at',label:'Last checked'}] },
  inventory: { title: 'Inventory', description: 'Stock visibility and supplier-reported quantities. Changes remain approval-gated.', table: 'inventory_items', orderBy: 'checked_at', columns: [{key:'variant_id',label:'Variant'},{key:'available_quantity',label:'Available'},{key:'supplier_reported',label:'Supplier reported'},{key:'checked_at',label:'Last checked'}] },
  finance: { title: 'Sales & Finance', description: 'Sales records and currency-aware financial reporting.', table: 'sales_records', orderBy: 'recorded_at', columns: [{key:'order_id',label:'Order reference'},{key:'gross_sales',label:'Gross sales'},{key:'currency',label:'Currency'},{key:'recorded_at',label:'Recorded'}] },
  support: { title: 'Customer Support', description: 'Support requests, ownership and resolution status.', table: 'support_tickets', columns: [{key:'subject',label:'Subject'},{key:'status',label:'Status'},{key:'created_at',label:'Created'}] },
  staff: { title: 'Staff & Access', description: 'Administrator identities, assigned roles and access posture.', table: 'admin_profiles', columns: [{key:'display_name',label:'Administrator'},{key:'staff_status',label:'Staff status'},{key:'created_at',label:'Added'}] },
  notifications: { title: 'Notifications', description: 'System alerts and operational notices.', table: 'system_alerts', columns: [{key:'source',label:'Source'},{key:'severity',label:'Severity'},{key:'message',label:'Message'},{key:'created_at',label:'Created'}] },
  reports: { title: 'Reports & Analytics', description: 'Verified sales records, activity and operational reporting.', table: 'sales_records', columns: [{key:'order_id',label:'Order reference'},{key:'gross_sales',label:'Gross sales'},{key:'currency',label:'Currency'},{key:'recorded_at',label:'Recorded'}] },
  settings: { title: 'Settings & System Health', description: 'Store configuration, integration readiness and security controls.' },
  assistant: { title: 'AI Operations Assistant', description: 'Research, analyse and prepare recommendations for owner review.' },
};

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' && value.length > 24) return value.replace('T', ' ').slice(0, 19);
  return String(value);
}

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const config = pageConfig[section];
  if (!config) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== 'vendrahub@hotmail.com') redirect('/admin/login');
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== 'aal2') redirect('/admin/mfa');
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from('admin_profiles').select('staff_status,display_name').eq('user_id', user.id).maybeSingle(),
    supabase.from('admin_role_assignments').select('role_code').eq('user_id', user.id),
  ]);
  if (profile?.staff_status !== 'active' || !roles?.some(role => role.role_code === 'super_admin')) redirect('/admin/login?error=not_authorised');

  let rows: Row[] = [];
  let count = 0;
  let errorMessage = '';
  if (config.table) {
    const countResult = await supabase.from(config.table).select('*', { count: 'exact', head: true });
    count = countResult.count ?? 0;
    const columns = (config.columns ?? []).map(column => column.key).join(',');
    const result = await supabase.from(config.table).select(columns).order(config.orderBy ?? 'created_at', { ascending: false }).limit(12);
    if (result.error) errorMessage = 'The current owner session could not read this data under the active database policies.';
    else rows = (result.data ?? []) as Row[];
  }

  return (
    <AdminWorkspace active={section} title={config.title}>
      <section className="admin-screen-heading">
        <div><p className="admin-kicker">MANAGEMENT / {section.toUpperCase()}</p><h1>{config.title}</h1><p>{config.description}</p></div>
        <span className="preview-chip">SECURE OWNER VIEW</span>
      </section>
      {section === 'assistant' ? (
        <div className="admin-ai-layout">
          <article className="admin-card admin-ai-panel">
            <div className="admin-ai-mark">✦</div>
            <p className="admin-kicker">VENDRAHUB INTELLIGENCE</p>
            <h2>Your operations copilot</h2>
            <p>The assistant workspace is ready for its model connection. It will use approved marketplace data and prepare recommendations for review.</p>
            <div className="admin-ai-prompts"><span>Summarise store performance</span><span>Find low-stock products</span><span>Compare supplier options</span><span>Draft a product description</span></div>
            <div className="admin-ai-input"><span>Ask VendraHub AI about your store…</span><button type="button" disabled>Connect AI service first</button></div>
          </article>
          <aside className="admin-card"><h3>Approval controls</h3><ul className="feature-list"><li>AI can analyse and draft.</li><li>Owner approves every consequential action.</li><li>No autonomous purchases or supplier orders.</li><li>No automatic refunds or inventory writes.</li></ul></aside>
        </div>
      ) : section === 'settings' ? (
        <div className="settings-grid">
          <article className="admin-card"><h3>Marketplace identity</h3><p>Business model</p><strong>Fashion & lifestyle ecommerce marketplace</strong><p>Store currency</p><strong>NGN · verify against Shopify settings</strong><p>Shopify store</p><strong>vendrahub-store.myshopify.com</strong></article>
          <article className="admin-card"><h3>Security posture</h3><ul className="feature-list"><li>Owner-only admin routes with AAL2 MFA.</li><li>Supabase row-level security enforced.</li><li>Secrets remain server-side.</li><li>Privileged actions require approval and audit.</li></ul></article>
        </div>
      ) : (
        <>
          <div className="admin-metrics">
            <article className="metric-card"><span>Total records</span><strong>{count}</strong><small>Read through the signed-in owner session</small></article>
            <article className="metric-card"><span>Rows shown</span><strong>{rows.length}</strong><small>Most recent 12 records</small></article>
            <article className="metric-card"><span>Data access</span><strong>{errorMessage ? 'Restricted' : 'Connected'}</strong><small>{errorMessage ? 'Check RLS and owner session' : 'Supabase session + RLS'}</small></article>
            <article className="metric-card"><span>Write operations</span><strong>Approval only</strong><small>No automatic live changes</small></article>
          </div>
          <section className="admin-card admin-data-panel">
            <div className="card-heading"><div><h3>Latest {config.title.toLowerCase()}</h3><p>Live records returned by the protected Supabase session.</p></div><span className="muted-tag">{count} RECORDS</span></div>
            {errorMessage ? <div className="admin-empty"><strong>Data access restricted</strong><p>{errorMessage}</p></div> : rows.length === 0 ? <div className="admin-empty"><strong>No records available yet</strong><p>This table currently has no visible records for this owner session.</p></div> : (
              <div className="admin-table-wrap"><table className="admin-data-table"><thead><tr>{config.columns?.map(column => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={String(row.id ?? row.order_id ?? index)}>{config.columns?.map(column=><td key={column.key}>{formatValue(row[column.key])}</td>)}</tr>)}</tbody></table></div>
            )}
          </section>
        </>
      )}
      <div className="admin-screen-footer"><Link href="/admin">← Back to overview</Link><span>VendraHub · Protected administration</span></div>
    </AdminWorkspace>
  );
}
