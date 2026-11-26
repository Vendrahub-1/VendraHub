'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const secondaryLinks = [
  { href: '/customer/cart', label: 'Shopping Bag', icon: '🛍' },
  { href: '/customer/orders#order-details', label: 'Order Details', icon: '▤' },
  { href: '/customer/orders#payment-information', label: 'Payment Information', icon: '▣' },
  { href: '/customer/orders#delivery-tracking', label: 'Delivery & Tracking', icon: '↗' },
  { href: '/customer/orders#cancellations', label: 'Cancellations', icon: '⊘' },
  { href: '/customer/orders#returns-refunds', label: 'Returns & Refunds', icon: '↺' },
  { href: '/customer/orders#order-support', label: 'Order Support', icon: '◉' },
  { href: '/customer/account#profile', label: 'Personal Details', icon: '♙' },
  { href: '/customer/account#addresses', label: 'Delivery Addresses', icon: '⌖' },
  { href: '/customer/account#support', label: 'Customer Support', icon: '✉' },
];

export default function CustomerSidebar() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (mounted) setSignedIn(!error && Boolean(data.user));
    }).catch(() => {
      if (mounted) setSignedIn(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSignedIn(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function closeMenu() {
    setOpen(false);
    setSignOutError('');
  }

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setSignOutError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    setBusy(false);

    if (error) {
      setSignOutError('We could not log you out. Please try again.');
      return;
    }

    setSignedIn(false);
    closeMenu();
    router.refresh();
  }

  return (
    <div className="vh-customer-menu">
      <button
        type="button"
        className="vh-customer-menu-trigger"
        aria-label="Open customer sidebar"
        aria-expanded={open}
        aria-controls="vh-customer-sidebar"
        onClick={() => setOpen(value => !value)}
      >
        ☰
      </button>

      {open && <button type="button" className="vh-customer-menu-backdrop" aria-label="Close sidebar" onClick={closeMenu} />}

      <aside
        id="vh-customer-sidebar"
        className={open ? 'vh-customer-sidebar is-open' : 'vh-customer-sidebar'}
        aria-label="Customer shortcuts"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="vh-customer-sidebar-head">
          <strong>VendraHub</strong>
          <button type="button" onClick={closeMenu} aria-label="Close sidebar">×</button>
        </div>

        <nav aria-label="Secondary customer navigation">
          {secondaryLinks.map(item => {
            const targetPath = item.href.split('#')[0];
            const active = !item.href.includes('#') && pathname === targetPath;
            return (
              <Link
                href={item.href}
                key={item.href}
                onClick={closeMenu}
                aria-current={active ? 'page' : undefined}
                className={active ? 'is-active' : undefined}
              >
                <span className="vh-customer-sidebar-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                <span className="vh-customer-sidebar-arrow" aria-hidden="true">›</span>
              </Link>
            );
          })}
        </nav>

        {signedIn === null ? (
          <div className="vh-customer-sidebar-auth-placeholder" aria-label="Checking account status" />
        ) : signedIn ? (
          <button type="button" className="vh-customer-sidebar-auth" onClick={signOut} disabled={busy}>
            <span aria-hidden="true">↪</span>
            <span>{busy ? 'Logging out…' : 'Logout'}</span>
          </button>
        ) : (
          <Link className="vh-customer-sidebar-auth" href="/customer/login" onClick={closeMenu}>
            <span aria-hidden="true">⇥</span>
            <span>Login / Create Account</span>
          </Link>
        )}

        {signOutError && <p className="vh-customer-sidebar-error" role="alert">{signOutError}</p>}
      </aside>
    </div>
  );
}
