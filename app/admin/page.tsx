'use client';

import { useMemo, useState } from 'react';

const primaryNavigation = [
  { id: 'overview', label: 'Home', group: 'PRIMARY' },
  { id: 'products', label: 'Products', group: 'PRIMARY' },
  { id: 'orders', label: 'Orders', group: 'PRIMARY' },
] as const;

const secondaryNavigation = [
  { id: 'customers', label: 'Customers', group: 'Store management', keywords: 'buyers customer directory profiles' },
  { id: 'inventory', label: 'Inventory', group: 'Store management', keywords: 'stock sku availability low stock' },
  { id: 'discounts', label: 'Discounts & promotions', group: 'Store management', keywords: 'coupon offers promo codes sales' },
  { id: 'suppliers', label: 'Suppliers & dropshipping', group: 'Sourcing & fulfilment', keywords: 'syncee sourcing supplier fulfilment dsers cj' },
  { id: 'finance', label: 'Sales & profit', group: 'Business insights', keywords: 'revenue costs margin fees currency' },
  { id: 'reports', label: 'Reports', group: 'Business insights', keywords: 'analytics performance export' },
  { id: 'support', label: 'Customer support', group: 'Customer experience', keywords: 'inbox enquiries returns complaints' },
  { id: 'notifications', label: 'Notifications', group: 'Customer experience', keywords: 'alerts messages updates' },
  { id: 'assistant', label: 'AI assistant', group: 'AI & administration', keywords: 'artificial intelligence drafts recommendations' },
  { id: 'staff', label: 'Staff & permissions', group: 'AI & administration', keywords: 'users roles access team' },
  { id: 'audit', label: 'Audit & security', group: 'AI & administration', keywords: 'logs security activity events' },
  { id: 'settings', label: 'Settings', group: 'AI & administration', keywords: 'configuration preferences integrations' },
] as const;

type ScreenId = (typeof primaryNavigation)[number]['id'] | (typeof secondaryNavigation)[number]['id'];

const screenCopy: Record<Exclude<ScreenId, 'overview'>, { title: string; subtitle: string; description: string; cards: { title: string; detail: string }[] }> = {
  products: {
    title: 'Products', subtitle: 'Catalogue and product management',
    description: 'Review the product workspace layout. Product records, variants, prices and publishing controls will be connected later.',
    cards: [
      { title: 'Product catalogue', detail: 'Placeholder for product search, categories, product status and catalogue rows.' },
      { title: 'Add a product', detail: 'The product creation flow will appear here after the Shopify Admin integration is approved.' },
      { title: 'Product approvals', detail: 'Review supplier products and approve each import before it can enter the store.' },
    ],
  },
  orders: {
    title: 'Orders', subtitle: 'Order review and fulfilment workspace',
    description: 'This is a preview of the order-management screen. No live orders or payment information is loaded.',
    cards: [
      { title: 'All orders', detail: 'Placeholder table for order number, date, customer, status and total.' },
      { title: 'Returns and refunds', detail: 'A review queue will be displayed here. Refund actions are not available in preview mode.' },
      { title: 'Fulfilment', detail: 'Shipment, tracking and supplier fulfilment status will appear here after integration.' },
    ],
  },
  customers: {
    title: 'Customers', subtitle: 'Customer directory and support context',
    description: 'Customer data is intentionally not loaded in this front-end preview.',
    cards: [
      { title: 'Customer directory', detail: 'Placeholder for customer search, contact details and account status.' },
      { title: 'Customer history', detail: 'Order and interaction history will appear here when authorised data access is configured.' },
    ],
  },
  inventory: {
    title: 'Inventory', subtitle: 'Stock, SKUs and supplier availability',
    description: 'No live inventory is read or modified in preview mode.',
    cards: [
      { title: 'Stock overview', detail: 'Placeholder for SKU, available quantity, reserved quantity and stock status.' },
      { title: 'Supplier stock checks', detail: 'Supplier availability and last-checked timestamps will appear here after integration.' },
      { title: 'Low-stock alerts', detail: 'A review queue for products that need attention.' },
    ],
  },
  discounts: {
    title: 'Discounts & promotions', subtitle: 'Campaigns, discount codes and offers',
    description: 'Promotion management is display-only in this preview. No discount codes are created or changed.',
    cards: [
      { title: 'Discount codes', detail: 'Placeholder for code, discount type, usage limits and active dates.' },
      { title: 'Automatic promotions', detail: 'Review planned offers and eligibility rules before approval.' },
      { title: 'Campaign performance', detail: 'Verified redemption and sales data will appear after integration.' },
    ],
  },
  finance: {
    title: 'Sales & profit', subtitle: 'Revenue, costs and margin reporting',
    description: 'No financial figures are fabricated. Verified sales, fees, supplier costs and shipping data will populate this screen later.',
    cards: [
      { title: 'Sales summary', detail: 'Placeholder for gross sales, discounts, refunds and net sales.' },
      { title: 'Profit and margin', detail: 'Placeholder for supplier cost, delivery cost, platform fees and realised margin.' },
      { title: 'Currency overview', detail: 'Currency conversion and reporting rules will be configured before live reporting.' },
    ],
  },
  reports: {
    title: 'Reports', subtitle: 'Store performance and operational analytics',
    description: 'Reports will remain empty until verified data sources are connected.',
    cards: [
      { title: 'Sales reports', detail: 'Placeholder for sales by period, product and country.' },
      { title: 'Supplier performance', detail: 'Placeholder for delivery reliability, stock accuracy and cost comparisons.' },
      { title: 'Store performance', detail: 'Placeholder for conversion, returns and customer support trends.' },
    ],
  },
  support: {
    title: 'Customer support', subtitle: 'Enquiries and resolution workflow',
    description: 'This preview does not read customer messages or send replies.',
    cards: [
      { title: 'Inbox', detail: 'Placeholder for open, pending and resolved support requests.' },
      { title: 'Returns and complaints', detail: 'A triage workspace for customer issues and return requests.' },
    ],
  },
  notifications: {
    title: 'Notifications', subtitle: 'Store, supplier and security alerts',
    description: 'No email, SMS or push notifications are sent from this screen.',
    cards: [
      { title: 'Notification centre', detail: 'Placeholder for unread alerts, status and timestamps.' },
      { title: 'Delivery settings', detail: 'Notification channels and templates will be configured later.' },
    ],
  },
  assistant: {
    title: 'AI assistant', subtitle: 'Research, explanations and draft recommendations',
    description: 'The assistant workspace is a visual placeholder. It cannot execute store operations.',
    cards: [
      { title: 'Supplier research', detail: 'Compare supplier reliability, delivered cost and stock consistency.' },
      { title: 'Content drafts', detail: 'Prepare product descriptions and marketing copy for human review.' },
      { title: 'Operations insights', detail: 'Summarise verified trends and flag data-quality issues.' },
    ],
  },
  staff: {
    title: 'Staff & permissions', subtitle: 'Roles, permissions and access management',
    description: 'Staff management is not active in this preview. Permission changes are disabled.',
    cards: [
      { title: 'Administrator roles', detail: 'Placeholder for owner, manager and support roles.' },
      { title: 'Permissions', detail: 'A permission matrix will be configured before staff access is enabled.' },
      { title: 'Team access', detail: 'Invitations and access reviews will appear here after the security model is approved.' },
    ],
  },
  audit: {
    title: 'Audit & security', subtitle: 'Administrative activity and security review',
    description: 'The audit workspace is a placeholder. No live security events are loaded.',
    cards: [
      { title: 'Audit history', detail: 'A timestamped record of approved administrative changes.' },
      { title: 'Security checks', detail: 'Review authentication, permissions and integration status.' },
      { title: 'Access events', detail: 'Sign-in and privileged access records will appear after secure backend integration.' },
    ],
  },
  settings: {
    title: 'Settings', subtitle: 'Store configuration and system preferences',
    description: 'Settings are display-only in this preview. Changes are not saved.',
    cards: [
      { title: 'Store profile', detail: 'VendraHub · More Choice. Better Living. · vendrahub.com' },
      { title: 'Regional preferences', detail: 'Nigeria and international customers. Currency and tax rules require verification.' },
      { title: 'Security', detail: 'Owner authentication, MFA, least-privilege access and audit logging.' },
      { title: 'Integrations', detail: 'Shopify Admin API and supplier connections will be configured in a later phase.' },
    ],
  },
};

function PlaceholderCard({ title, detail, onPreview }: { title: string; detail: string; onPreview: () => void }) {
  return (
    <article className="admin-card preview-card">
      <div className="preview-card-top"><span className="preview-icon">◇</span><span className="preview-status">PLACEHOLDER</span></div>
      <h3>{title}</h3>
      <p>{detail}</p>
      <button type="button" className="preview-action" onClick={onPreview}>Preview section <span aria-hidden="true">→</span></button>
    </article>
  );
}

export default function AdminPage() {
  const [active, setActive] = useState<ScreenId>('overview');
  const [notice, setNotice] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNavigation = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return secondaryNavigation;
    return secondaryNavigation.filter(item =>
      item.label.toLowerCase().includes(term) ||
      item.group.toLowerCase().includes(term) ||
      item.keywords.includes(term)
    );
  }, [searchTerm]);

  const navigationGroups = useMemo(() => {
    const groups = new Map<string, typeof filteredNavigation[number][]>();
    filteredNavigation.forEach(item => {
      const current = groups.get(item.group) ?? [];
      groups.set(item.group, [...current, item]);
    });
    return Array.from(groups.entries());
  }, [filteredNavigation]);

  const current = active === 'overview'
    ? { label: 'Dashboard' }
    : primaryNavigation.find(item => item.id === active) ?? secondaryNavigation.find(item => item.id === active)!;

  function openScreen(id: ScreenId) {
    setActive(id);
    setNotice('');
    setMobileMenuOpen(false);
    setSearchTerm('');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showPlaceholder(message: string) { setNotice(message); }

  return (
    <main className="admin-layout">
      <aside className={`admin-sidebar${mobileMenuOpen ? ' mobile-sidebar-open' : ''}`}>
        <button type="button" className="admin-brand brand-button" onClick={() => openScreen('overview')} aria-label="Open dashboard home">
          <span className="brand-mark">V</span><span><strong>VendraHub</strong><small>ADMIN CONSOLE</small></span>
        </button>
        <div className="sidebar-label">FIND A WORKSPACE</div>
        <label className="sidebar-search">
          <span aria-hidden="true">⌕</span>
          <input aria-label="Search admin sections" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search sections..." />
          {searchTerm && <button type="button" aria-label="Clear search" onClick={() => setSearchTerm('')}>×</button>}
        </label>
        <nav aria-label="Secondary admin navigation" className="admin-nav">
          {navigationGroups.length ? navigationGroups.map(([group, items]) => (
            <section className="nav-group" key={group}>
              <div className="sidebar-label nav-group-label">{group}</div>
              {items.map(item => (
                <button key={item.id} type="button" onClick={() => openScreen(item.id)} className={active === item.id ? 'active' : ''} aria-current={active === item.id ? 'page' : undefined}>
                  <span className="nav-dot">{item.label.slice(0, 1)}</span>{item.label}
                </button>
              ))}
            </section>
          )) : <p className="nav-no-results">No matching section. Try another search.</p>}
        </nav>
        <div className="sidebar-bottom"><span className="status-dot" /> Front-end preview <small>Backend integrations are not connected in this view.</small><button type="button" onClick={() => openScreen('overview')}>← Dashboard home</button></div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-title"><span className="topbar-overline">VENDRAHUB / ADMIN</span><strong>{current.label}</strong></div>
          <div className="topbar-actions">
            <button type="button" className="mobile-more-toggle" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(value => !value)}>{mobileMenuOpen ? 'Close' : 'More'}</button>
            <button type="button" className="notification-button" aria-label="Open notifications" title="Notifications" onClick={() => openScreen('notifications')}><span aria-hidden="true">♧</span><i /></button>
            <span className="preview-chip">FRONT-END PREVIEW</span>
            <a href="https://www.vendrahub.com/" target="_blank" rel="noreferrer">Storefront ↗</a>
          </div>
        </header>

        <div className="admin-content">
          {notice && <div className="preview-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div>}

          {active === 'overview' ? (
            <>
              <section className="admin-welcome dashboard-welcome">
                <div><p className="admin-kicker">MORE CHOICE. BETTER LIVING.</p><h1>Dashboard</h1><p>Your VendraHub activity at a glance.</p></div>
                <button type="button" className="dashboard-ai-button" onClick={() => openScreen('assistant')}><span aria-hidden="true">✧</span><span><strong>AI assistant</strong><small>Open your AI workspace</small></span><b>→</b></button>
              </section>
              <section className="admin-card dashboard-activity" aria-labelledby="activity-title">
                <div className="card-heading"><div><h3 id="activity-title">Recent activity</h3><p>Updates and events from your store workspace</p></div><span className="muted-tag">ACTIVITY</span></div>
                <div className="activity-empty">
                  <span className="activity-empty-icon" aria-hidden="true">◷</span>
                  <strong>No activity to display yet</strong>
                  <p>Store and admin activity will appear here when the authorised data connections are enabled.</p>
                </div>
              </section>
            </>
          ) : active === 'suppliers' ? (
            <>
              <section className="admin-welcome"><div><p className="admin-kicker">SOURCING WORKSPACE</p><h1>Supplier connections</h1><p>Compare the supplier connection areas. No accounts are connected and no supplier actions are performed here.</p></div></section>
              <div className="admin-alert"><span className="alert-icon">i</span><div><strong>Supplier integrations are placeholders</strong><p>Official supplier pages are provided for reference. Opening them will leave the admin preview; authorisation and purchases are not initiated here.</p></div></div>
              <div className="supplier-grid">
                {[
                  {name:'Syncee',desc:'Product discovery, supplier catalogue and Shopify app connection.',url:'https://help.syncee.com/en/articles/8886065-how-to-install-syncee-to-your-shopify-store'},
                  {name:'DSers',desc:'Supplier sourcing and order workflow through the Shopify app.',url:'https://help.dsers.com/link-shopify-store/'},
                  {name:'CJdropshipping',desc:'Supplier catalogue and optional direct API integration.',url:'https://developers.cjdropshipping.com/en/api/start/apikey.html'},
                ].map(s => <article className="admin-card supplier-card" key={s.name}><div className="supplier-title"><div><h3>{s.name}</h3><small>Not connected · preview only</small></div><span className="state">PLACEHOLDER</span></div><p>{s.desc}</p><div className="supplier-links"><a href={s.url} target="_blank" rel="noreferrer">Read official guide ↗</a><button type="button" onClick={() => showPlaceholder(s.name + ' connection will be configured after backend integration.')}>Connection details</button></div></article>)}
              </div>
            </>
          ) : (
            <>
              <section className="admin-welcome"><div><p className="admin-kicker">VENDRAHUB MANAGEMENT</p><h1>{screenCopy[active].title}</h1><p>{screenCopy[active].subtitle}</p></div><div className="welcome-date">PREVIEW MODE</div></section>
              <div className="admin-alert"><span className="alert-icon">i</span><div><strong>{screenCopy[active].title} is a front-end placeholder</strong><p>{screenCopy[active].description}</p></div></div>
              <div className="preview-card-grid">{screenCopy[active].cards.map(card => <PlaceholderCard key={card.title} title={card.title} detail={card.detail} onPreview={() => showPlaceholder(card.title + ': this screen is a visual placeholder. Backend connection is intentionally disabled.')}/>)}</div>
            </>
          )}

          <footer className="admin-footer"><span>VendraHub · Administration</span><span>Black · White · Gold · Preview only</span><button type="button" onClick={() => openScreen('overview')}>Return to dashboard ↑</button></footer>
        </div>
      </div>

      <nav className="mobile-app-nav" aria-label="Primary app navigation">
        <button type="button" className={active === 'overview' ? 'active' : ''} onClick={() => openScreen('overview')}><span aria-hidden="true">⌂</span><small>Home</small></button>
        <button type="button" className={active === 'products' ? 'active' : ''} onClick={() => openScreen('products')}><span aria-hidden="true">◇</span><small>Products</small></button>
        <button type="button" className={active === 'orders' ? 'active' : ''} onClick={() => openScreen('orders')}><span aria-hidden="true">▤</span><small>Orders</small></button>
        <button type="button" className={mobileMenuOpen ? 'active' : ''} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(value => !value)}><span aria-hidden="true">•••</span><small>More</small></button>
      </nav>
    </main>
  );
}
