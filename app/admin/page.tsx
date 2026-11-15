'use client';

import { useState } from 'react';

const navigation = [
  { id: 'overview', label: 'Overview', group: 'WORKSPACE' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'finance', label: 'Sales & profit' },
  { id: 'support', label: 'Support' },
  { id: 'assistant', label: 'AI assistant' },
  { id: 'staff', label: 'Staff & access' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
] as const;

type ScreenId = (typeof navigation)[number]['id'];

const screenCopy: Record<Exclude<ScreenId, 'overview' | 'suppliers'>, { title: string; subtitle: string; description: string; cards: { title: string; detail: string }[] }> = {
  products: {
    title: 'Products',
    subtitle: 'Catalogue and product management',
    description: 'Review the product workspace layout. Product records, variants, prices and publishing controls will be connected later.',
    cards: [
      { title: 'Product catalogue', detail: 'Placeholder for product search, categories, product status and catalogue rows.' },
      { title: 'Add a product', detail: 'The product creation flow will appear here after the Shopify Admin integration is approved.' },
      { title: 'Product approvals', detail: 'Review supplier products and approve each import before it can enter the store.' },
    ],
  },
  orders: {
    title: 'Orders',
    subtitle: 'Order review and fulfilment workspace',
    description: 'This is a preview of the order-management screen. No live orders or payment information is loaded.',
    cards: [
      { title: 'All orders', detail: 'Placeholder table for order number, date, customer, status and total.' },
      { title: 'Returns and refunds', detail: 'A review queue will be displayed here. Refund actions are not available in preview mode.' },
      { title: 'Fulfilment', detail: 'Shipment, tracking and supplier fulfilment status will appear here after integration.' },
    ],
  },
  customers: {
    title: 'Customers',
    subtitle: 'Customer directory and support context',
    description: 'Customer data is intentionally not loaded in this front-end preview.',
    cards: [
      { title: 'Customer directory', detail: 'Placeholder for customer search, contact details and account status.' },
      { title: 'Customer history', detail: 'Order and interaction history will appear here when authorised data access is configured.' },
    ],
  },
  inventory: {
    title: 'Inventory',
    subtitle: 'Stock, SKUs and supplier availability',
    description: 'No live inventory is read or modified in preview mode.',
    cards: [
      { title: 'Stock overview', detail: 'Placeholder for SKU, available quantity, reserved quantity and stock status.' },
      { title: 'Supplier stock checks', detail: 'Supplier availability and last-checked timestamps will appear here after integration.' },
      { title: 'Low-stock alerts', detail: 'A review queue for products that need attention.' },
    ],
  },
  finance: {
    title: 'Sales & profit',
    subtitle: 'Revenue, costs and margin reporting',
    description: 'No financial figures are fabricated. Verified sales, fees, supplier costs and shipping data will populate this screen later.',
    cards: [
      { title: 'Sales summary', detail: 'Placeholder for gross sales, discounts, refunds and net sales.' },
      { title: 'Profit and margin', detail: 'Placeholder for supplier cost, delivery cost, platform fees and realised margin.' },
      { title: 'Currency overview', detail: 'Currency conversion and reporting rules will be configured before live reporting.' },
    ],
  },
  support: {
    title: 'Customer support',
    subtitle: 'Enquiries and resolution workflow',
    description: 'This preview does not read customer messages or send replies.',
    cards: [
      { title: 'Inbox', detail: 'Placeholder for open, pending and resolved support requests.' },
      { title: 'Returns and complaints', detail: 'A triage workspace for customer issues and return requests.' },
    ],
  },
  assistant: {
    title: 'AI assistant',
    subtitle: 'Research, explanations and draft recommendations',
    description: 'The assistant workspace is a visual placeholder. It cannot execute store operations.',
    cards: [
      { title: 'Supplier research', detail: 'Compare supplier reliability, delivered cost and stock consistency.' },
      { title: 'Content drafts', detail: 'Prepare product descriptions and marketing copy for human review.' },
      { title: 'Operations insights', detail: 'Summarise verified trends and flag data-quality issues.' },
    ],
  },
  staff: {
    title: 'Staff & access',
    subtitle: 'Roles, permissions and audit visibility',
    description: 'Staff management is not active in this preview. Existing owner authentication has not been changed.',
    cards: [
      { title: 'Administrator roles', detail: 'Placeholder for owner, manager and support roles.' },
      { title: 'Permissions', detail: 'A permission matrix will be configured before staff access is enabled.' },
      { title: 'Audit history', detail: 'Privileged actions and administrative events will be shown here.' },
    ],
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Store, supplier and security alerts',
    description: 'No email, SMS or push notifications are sent from this screen.',
    cards: [
      { title: 'Notification centre', detail: 'Placeholder for unread alerts, status and timestamps.' },
      { title: 'Delivery settings', detail: 'Notification channels and templates will be configured later.' },
    ],
  },
  reports: {
    title: 'Reports',
    subtitle: 'Store performance and operational analytics',
    description: 'Reports will remain empty until verified data sources are connected.',
    cards: [
      { title: 'Sales reports', detail: 'Placeholder for sales by period, product and country.' },
      { title: 'Supplier performance', detail: 'Placeholder for delivery reliability, stock accuracy and cost comparisons.' },
      { title: 'Store performance', detail: 'Placeholder for conversion, returns and customer support trends.' },
    ],
  },
  settings: {
    title: 'Settings',
    subtitle: 'Store configuration and system preferences',
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

  function openScreen(id: ScreenId) {
    setActive(id);
    setNotice('');
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showPlaceholder(message: string) {
    setNotice(message);
  }

  const currentIndex = navigation.findIndex(item => item.id === active);
  const current = navigation[currentIndex];

  return (
    <main className="admin-layout">
      <aside className={`admin-sidebar${mobileMenuOpen ? " mobile-sidebar-open" : ""}`}>
        <button type="button" className="admin-brand brand-button" onClick={() => openScreen('overview')} aria-label="Open dashboard overview">
          <span className="brand-mark">V</span><span><strong>VendraHub</strong><small>ADMIN CONSOLE</small></span>
        </button>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Admin navigation" className="admin-nav">
          {navigation.map((item, index) => (
            <button key={item.id} type="button" onClick={() => openScreen(item.id)} className={active === item.id ? 'active' : ''} aria-current={active === item.id ? 'page' : undefined}>
              <span className="nav-dot">{String(index + 1).padStart(2, '0')}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom"><span className="status-dot" /> Front-end preview <small>Backend integrations are not connected in this view.</small><button type="button" onClick={() => openScreen('overview')}>← Back to overview</button></div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-title"><span className="topbar-overline">VENDRAHUB / ADMIN</span><strong>{current.label}</strong></div>
          <div className="topbar-actions"><button type="button" className="mobile-more-toggle" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(value => !value)}>{mobileMenuOpen ? "Close menu" : "More"}</button><span className="preview-chip">FRONT-END PREVIEW</span><button type="button" className="topbar-button" onClick={() => openScreen('overview')}>Dashboard home</button><a href="https://www.vendrahub.com/" target="_blank" rel="noreferrer">Storefront ↗</a></div>
        </header>

        <div className="admin-content">
          {notice && <div className="preview-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div>}

          {active === 'overview' ? (
            <>
              <section className="admin-welcome">
                <div><p className="admin-kicker">MORE CHOICE. BETTER LIVING.</p><h1>Welcome to VendraHub <span>administration.</span></h1><p>Explore the dashboard and every administration screen. All business data below is illustrative placeholder content.</p></div>
                <div className="welcome-date">ADMIN WORKSPACE<br/><strong>PREVIEW MODE</strong></div>
              </section>
              <div className="admin-alert"><span className="alert-icon">i</span><div><strong>Front-end preview — no backend data is connected to this dashboard</strong><p>Navigation and preview controls work. Products, orders, customer information, inventory, sales and supplier records are placeholders. No store changes or messages are sent.</p></div></div>
              <div className="admin-metrics">
                {[['Total products','—','Placeholder · awaiting connection'],['Orders today','—','Placeholder · awaiting connection'],['Customers','—','Placeholder · awaiting connection'],['Sales & profit','—','No financial figures displayed']].map(metric => <article className="metric-card" key={metric[0]}><span>{metric[0]}</span><strong>{metric[1]}</strong><small>{metric[2]}</small></article>)}
              </div>
              <div className="overview-grid">
                <article className="admin-card"><div className="card-heading"><div><h3>Store activity</h3><p>Activity timeline preview</p></div><span className="muted-tag">DEMO</span></div><div className="activity-placeholder"><div><b>01</b><span><strong>Admin workspace prepared</strong><small>Navigation and screen layout available</small></span></div><div><b>02</b><span><strong>Backend connection pending</strong><small>Live store data will appear in a later phase</small></span></div><div><b>03</b><span><strong>Operations remain disabled</strong><small>No product, order, payment or inventory changes</small></span></div></div></article>
                <article className="admin-card"><div className="card-heading"><div><h3>Workspace readiness</h3><p>Front-end modules</p></div><span className="muted-tag">PREVIEW</span></div><ul className="readiness-list">{navigation.slice(1).map(item => <li key={item.id}><span>{item.label}</span><b className="state">Preview available</b></li>)}</ul></article>
              </div>
              <section className="admin-section"><div className="section-heading"><p className="admin-kicker">QUICK ACCESS</p><h2>Open a workspace</h2><p>Choose a section to inspect its layout and placeholder controls.</p></div><div className="quick-access-grid">{navigation.slice(1, 7).map(item => <button type="button" className="quick-access-button" key={item.id} onClick={() => openScreen(item.id)}><span>{item.label}</span><b>Open →</b></button>)}</div></section>
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
              <section className="admin-welcome"><div><p className="admin-kicker">VENDRAHUB MANAGEMENT</p><h1>{screenCopy[active].title}</h1><p>{screenCopy[active].subtitle}</p></div><div className="welcome-date">SCREEN {String(currentIndex + 1).padStart(2, '0')}<br/><strong>PREVIEW MODE</strong></div></section>
              <div className="admin-alert"><span className="alert-icon">i</span><div><strong>{screenCopy[active].title} is a front-end placeholder</strong><p>{screenCopy[active].description}</p></div></div>
              <div className="preview-card-grid">{screenCopy[active].cards.map(card => <PlaceholderCard key={card.title} title={card.title} detail={card.detail} onPreview={() => showPlaceholder(card.title + ': this screen is a visual placeholder. Backend connection is intentionally disabled.')}/>)}</div>
            </>
          )}

          <footer className="admin-footer"><span>VendraHub · Administration</span><span>Black · White · Gold · Preview only</span><button type="button" onClick={() => openScreen('overview')}>Return to dashboard ↑</button></footer>
        </div>
      </div>
    
      <nav className="mobile-app-nav" aria-label="App navigation">
        <button type="button" className={active === 'overview' ? 'active' : ''} onClick={() => openScreen('overview')}><span aria-hidden="true">⌂</span><small>Home</small></button>
        <button type="button" className={active === 'products' ? 'active' : ''} onClick={() => openScreen('products')}><span aria-hidden="true">◇</span><small>Products</small></button>
        <button type="button" className={active === 'orders' ? 'active' : ''} onClick={() => openScreen('orders')}><span aria-hidden="true">▤</span><small>Orders</small></button>
        <button type="button" className={mobileMenuOpen ? 'active' : ''} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(value => !value)}><span aria-hidden="true">•••</span><small>More</small></button>
      </nav>
    </main>
  );
}
