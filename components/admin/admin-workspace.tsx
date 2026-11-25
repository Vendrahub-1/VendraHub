import Image from 'next/image';
import Link from 'next/link';
import SignOutButton from '@/components/sign-out-button';
import AdminPwaControls from '@/components/admin/admin-pwa-controls';

export const adminSections = [
  { id: 'overview', label: 'Overview', href: '/admin' },
  { id: 'products', label: 'Products', href: '/admin/products' },
  { id: 'orders', label: 'Orders', href: '/admin/orders' },
  { id: 'customers', label: 'Customers', href: '/admin/customers' },
  { id: 'suppliers', label: 'Suppliers', href: '/admin/suppliers' },
  { id: 'inventory', label: 'Inventory', href: '/admin/inventory' },
  { id: 'finance', label: 'Sales & Finance', href: '/admin/finance' },
  { id: 'support', label: 'Customer Support', href: '/admin/support' },
  { id: 'assistant', label: 'AI Assistant', href: '/admin/assistant' },
  { id: 'staff', label: 'Staff & Access', href: '/admin/staff' },
  { id: 'notifications', label: 'Notifications', href: '/admin/notifications' },
  { id: 'reports', label: 'Reports & Analytics', href: '/admin/reports' },
  { id: 'settings', label: 'Settings & Health', href: '/admin/settings' },
];

export default function AdminWorkspace({ active, title, children }: { active: string; title: string; children: React.ReactNode }) {
  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <Image src="/vendrahub-icon.svg" alt="VendraHub" width={44} height={44} priority className="admin-brand-icon" />
          <span><strong>VendraHub</strong><small>ADMIN CONSOLE</small></span>
        </Link>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Admin navigation" className="admin-nav">
          {adminSections.map((item, index) => (
            <Link key={item.id} href={item.href} className={active === item.id ? 'active' : ''} aria-current={active === item.id ? 'page' : undefined}>
              <span className="nav-dot">{String(index + 1).padStart(2, '0')}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom"><span className="status-dot" /> Protected owner session <small>Authenticator verification required</small></div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div><span className="topbar-overline">VENDRAHUB / ADMIN</span><strong>{title}</strong></div>
          <div className="topbar-actions">
            <Link className="admin-ai-entry" href="/admin/assistant">✦ AI Assistant</Link>
            <AdminPwaControls /><span className="preview-chip">OWNER WORKSPACE</span>
            <SignOutButton />
            <a href="https://admin.shopify.com/store/vendrahub-store" target="_blank" rel="noreferrer">Shopify Admin ↗</a>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </main>
  );
}
