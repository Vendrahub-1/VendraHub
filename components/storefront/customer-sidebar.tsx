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

  function closeMenu() {
    setOpen(false);
  }

  async function signOut() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (!error) {
      setSignedIn(false);
      closeMenu();
      router.refresh();
    }
  }

  return (
    <div className="vh-customer-menu">
      <button type="button" className="vh-customer-menu-trigger" aria-label="Open customer sidebar" aria-expanded={open} aria-controls="vh-customer-sidebar" onClick={() => setOpen(value => !value)}>☰</button>
      {open && <button type="button" className="vh-customer-menu-backdrop" aria-label="Close sidebar" onClick={closeMenu} />}
      <aside id="vh-customer-sidebar" className={open ? 'vh-customer-sidebar is-open' : 'vh-customer-sidebar'} aria-label="Customer sidebar" aria-hidden={!open}>
        <div className="vh-customer-sidebar-head"><strong>VendraHub</strong><button type="button" onClick={closeMenu} aria-label="Close sidebar">×</button></div>
        <nav aria-label="Customer screen navigation">
          <p className="vh-customer-sidebar-label">MAIN SCREENS</p>
          <Link href="/customer" onClick={closeMenu}>Home & product collection</Link>
          <Link href="/customer/categories" onClick={closeMenu}>Explore categories</Link>
          <Link href="/customer/cart" onClick={closeMenu}>Shopping bag</Link>
          <Link href="/customer/wishlist" onClick={closeMenu}>Wishlist / Saved items</Link>
          <p className="vh-customer-sidebar-label">ORDERS & PURCHASES</p>
          <Link href="/customer/orders" onClick={closeMenu}>All orders & order history</Link>
          <Link href="/customer/orders#order-details" onClick={closeMenu}>Order details</Link>
          <Link href="/customer/orders#payment-information" onClick={closeMenu}>Payment information</Link>
          <Link href="/customer/orders#delivery-tracking" onClick={closeMenu}>Delivery & tracking</Link>
          <Link href="/customer/orders#cancellations" onClick={closeMenu}>Cancellations</Link>
          <Link href="/customer/orders#returns-refunds" onClick={closeMenu}>Returns & refunds</Link>
          <Link href="/customer/orders#order-support" onClick={closeMenu}>Order support</Link>
          <p className="vh-customer-sidebar-label">ACCOUNT & CUSTOMER CARE</p>
          <Link href="/customer/account" onClick={closeMenu}>Account overview</Link>
          <Link href="/customer/account#profile" onClick={closeMenu}>Personal details</Link>
          <Link href="/customer/account#addresses" onClick={closeMenu}>Delivery addresses</Link>
          <Link href="/customer/account#support" onClick={closeMenu}>Customer support</Link>
          {!signedIn && <>
            <p className="vh-customer-sidebar-label">SIGN IN</p>
            <Link href="/customer/login" onClick={closeMenu}>Login</Link>
            <Link href="/customer/login?mode=signup" onClick={closeMenu}>Create an account</Link>
          </>}
        </nav>
        {signedIn && <button type="button" className="vh-customer-sidebar-logout" onClick={signOut} disabled={busy}>{busy ? 'Signing out…' : 'Log out'}</button>}
      </aside>
    </div>
  );
}
