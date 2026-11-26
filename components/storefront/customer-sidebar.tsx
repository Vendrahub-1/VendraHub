'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CustomerSidebar() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session?.user)));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (!error) {
      setSignedIn(false);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="vh-customer-menu">
      <button type="button" className="vh-customer-menu-trigger" aria-label="Open customer sidebar" aria-expanded={open} onClick={() => setOpen(value => !value)}>☰</button>
      {open && <button type="button" className="vh-customer-menu-backdrop" aria-label="Close sidebar" onClick={() => setOpen(false)} />}
      <aside className={open ? 'vh-customer-sidebar is-open' : 'vh-customer-sidebar'} aria-label="Customer sidebar" aria-hidden={!open}>
        <div className="vh-customer-sidebar-head"><strong>VendraHub</strong><button type="button" onClick={() => setOpen(false)} aria-label="Close sidebar">×</button></div>
        <nav aria-label="Customer secondary navigation">
          <p className="vh-customer-sidebar-label">SHOP</p>
          <Link href="/customer/categories" onClick={() => setOpen(false)}>Explore categories</Link>
          <Link href="/customer/cart" onClick={() => setOpen(false)}>Shopping bag</Link>
          <Link href="/customer/wishlist" onClick={() => setOpen(false)}>Saved items / Wishlist</Link>
          <p className="vh-customer-sidebar-label">YOUR ORDERS</p>
          <Link href="/customer/orders" onClick={() => setOpen(false)}>Order history & tracking</Link>
          <Link href="/customer/orders" onClick={() => setOpen(false)}>Returns & refunds</Link>
          <p className="vh-customer-sidebar-label">ACCOUNT & HELP</p>
          <Link href="/customer/account#profile" onClick={() => setOpen(false)}>Personal details</Link>
          <Link href="/customer/account#addresses" onClick={() => setOpen(false)}>Delivery addresses</Link>
          <Link href="/customer/account#support" onClick={() => setOpen(false)}>Customer support</Link>
        </nav>
        {signedIn && <button type="button" className="vh-customer-sidebar-logout" onClick={signOut} disabled={busy}>{busy ? 'Signing out…' : 'Log out'}</button>}
      </aside>
    </div>
  );
}
