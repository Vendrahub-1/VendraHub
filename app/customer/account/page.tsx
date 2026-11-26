'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import SignOutButton from '@/components/sign-out-button';
import CustomerBottomNav from '@/components/storefront/customer-bottom-nav';

type Profile = { full_name: string | null; avatar_url?: string | null };
type Ticket = { id: string; subject: string; status: string; created_at: string };
type WishlistItem = { id: string; shopify_product_gid: string; created_at: string };
type Address = { id: string; label: string; recipient_name: string; phone: string; address_line1: string; address_line2: string | null; city: string; state_region: string | null; postal_code: string | null; country: string; is_default: boolean };

const emptyAddress = { label: 'Home', recipient_name: '', phone: '', address_line1: '', address_line2: '', city: '', state_region: '', postal_code: '', country: 'Nigeria', is_default: true };

const navigation = [
  { id: 'profile', label: 'Personal details', short: 'Profile', mark: '01' },
  { id: 'addresses', label: 'Delivery addresses', short: 'Addresses', mark: '02' },
  { id: 'support', label: 'Customer support', short: 'Support', mark: '04' },
];

export default function CustomerAccountPage() {
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<Profile>({ full_name: '' });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [activeSection, setActiveSection] = useState('profile');

  async function load() {
    setError('');
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) { window.location.assign('/customer/login'); return; }
      setEmail(user.email ?? '');
      const [p, t, w, a] = await Promise.all([
        supabase.from('profiles').select('full_name,avatar_url').eq('id', user.id).maybeSingle(),
        fetch('/api/customer/support', { cache: 'no-store' }),
        fetch('/api/customer/wishlist', { cache: 'no-store' }),
        fetch('/api/customer/addresses', { cache: 'no-store' }),
      ]);
      if (p.error) throw new Error('We could not load your profile details.');
      if (p.data) setProfile(p.data);
      const [ticketData, wishlistData, addressData] = await Promise.all([t.json(), w.json(), a.json()]);
      if (!t.ok) throw new Error(ticketData.error || 'We could not load your support history.');
      if (!w.ok) throw new Error(wishlistData.error || 'We could not load your wishlist.');
      if (!a.ok) throw new Error(addressData.error || 'We could not load your delivery addresses.');
      setTickets(ticketData.tickets ?? []);
      setWishlist(wishlistData.items ?? []);
      setAddresses(addressData.addresses ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not load your account. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const sections = navigation
      .map(item => document.getElementById(item.id))
      .filter((section): section is HTMLElement => section !== null);
    if (!sections.length) return;

    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]?.target.id) setActiveSection(visible[0].target.id);
    }, { rootMargin: '-18% 0px -62% 0px', threshold: [0, 0.15, 0.35, 0.6] });

    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  async function saveProfile(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: profile.full_name }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update profile.');
      setProfile(data.profile); setNotice('Your profile has been updated.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update profile.'); }
    finally { setBusy(false); }
  }

  async function submitTicket(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, message }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not submit support request.');
      setSubject(''); setMessage(''); setNotice('Your support request has been submitted.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not submit support request.'); }
    finally { setBusy(false); }
  }

  async function addAddress(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/addresses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addressForm) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save address.');
      setAddresses(current => [data.address, ...current.filter(x => !data.address.is_default || !x.is_default)]);
      setAddressForm({ ...emptyAddress, is_default: false });
      setNotice('Your delivery address has been saved.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save address.'); }
    finally { setBusy(false); }
  }

  async function removeAddress(id: string) {
    if (!window.confirm('Remove this delivery address?')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/addresses?id=' + encodeURIComponent(id), { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not remove address.');
      setAddresses(current => current.filter(x => x.id !== id)); setNotice('Delivery address removed.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not remove address.'); }
    finally { setBusy(false); }
  }

  async function removeWishlist(gid: string) {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/wishlist?product=' + encodeURIComponent(gid), { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not remove wishlist item.');
      setWishlist(current => current.filter(x => x.shopify_product_gid !== gid)); setNotice('Wishlist item removed.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not remove wishlist item.'); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="customer-loading"><div className="customer-loading-mark">VH</div><p>Preparing your VendraHub account…</p></main>;

  return (
    <main className="customer-account-shell">
      <header className="customer-account-header">
        <Link href="/customer" className="customer-account-brand" aria-label="VendraHub shop">
          <Image src="/vendrahub-logo.svg" alt="VendraHub" width={190} height={56} priority />
        </Link>
        <div className="customer-account-header-actions">
          <Link href="/customer" className="customer-continue-link"><span aria-hidden="true">←</span> Continue shopping</Link>
          <SignOutButton />
        </div>
      </header>

      <section className="customer-account-hero">
        <div className="customer-account-hero-copy">
          <p className="customer-overline">YOUR VENDRAHUB SPACE</p>
          <h1>Good to see you<span>.</span></h1>
          <p className="customer-account-welcome">Welcome back, <strong>{profile.full_name || 'VendraHub customer'}</strong></p>
          <p className="customer-account-email">{email}</p>
        </div>
        <div className="customer-account-hero-side">
          <div className="customer-avatar" aria-hidden="true">{(profile.full_name || 'V').trim().charAt(0).toUpperCase()}</div>
          <span className="customer-member-label">CUSTOMER ACCOUNT</span>
          <span className="customer-member-caption">Your details, orders and saved items</span>
        </div>
        <div className="customer-hero-watermark" aria-hidden="true">VH</div>
      </section>

      {notice && <p className="customer-feedback customer-feedback-success" role="status">{notice}</p>}
      {error && <p className="customer-feedback customer-feedback-error" role="alert">{error}</p>}

      <div className="customer-account-layout">


        <div className="customer-account-content">
          <section id="profile" className="customer-account-section">
            <div className="customer-section-topline"><span>01 / ACCOUNT</span><span>PERSONAL INFORMATION</span></div>
            <div className="customer-section-heading"><div><h2>Personal details</h2><p>Keep your contact information accurate and up to date.</p></div><span className="customer-section-symbol" aria-hidden="true">✳</span></div>
            <form className="customer-modern-form" onSubmit={saveProfile}>
              <label>Full name<input value={profile.full_name ?? ''} maxLength={120} onChange={e => setProfile({ ...profile, full_name: e.target.value })} required autoComplete="name" /></label>
              <label>Email address<input value={email} disabled autoComplete="email" /><small>Your sign-in email is managed by your account security settings.</small></label>
              <button className="customer-primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save profile'} <span aria-hidden="true">→</span></button>
            </form>
          </section>

          <section id="addresses" className="customer-account-section">
            <div className="customer-section-topline"><span>02 / DELIVERY</span><span>WHERE WE SEND YOUR ORDERS</span></div>
            <div className="customer-section-heading"><div><h2>Delivery addresses</h2><p>Manage the places where your orders should be delivered.</p></div><span className="customer-section-symbol" aria-hidden="true">⌖</span></div>
            {addresses.length > 0 ? <div className="customer-address-grid">{addresses.map(address => (
              <article className="customer-address-card" key={address.id}>
                <div className="customer-address-card-top"><span className="customer-address-label">{address.label}</span>{address.is_default && <span className="customer-default-label">DEFAULT</span>}</div>
                <strong>{address.recipient_name}</strong><p>{address.phone}</p>
                <p>{address.address_line1}{address.address_line2 ? ', ' + address.address_line2 : ''}</p>
                <p>{address.city}{address.state_region ? ', ' + address.state_region : ''}{address.postal_code ? ' ' + address.postal_code : ''}</p>
                <p>{address.country}</p>
                <button type="button" className="customer-remove-link" onClick={() => removeAddress(address.id)} disabled={busy}>Remove address</button>
              </article>
            ))}</div> : <div className="customer-empty-state"><span aria-hidden="true">⌖</span><strong>No delivery addresses yet</strong><p>Add an address below to make your next checkout easier.</p></div>}
            <form className="customer-modern-form customer-address-editor" onSubmit={addAddress}>
              <div className="customer-form-heading"><h3>Add a delivery address</h3><span>NEW ADDRESS</span></div>
              <div className="customer-modern-grid">
                <label>Label<input value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })} required placeholder="Home, Work…" /></label>
                <label>Recipient name<input value={addressForm.recipient_name} onChange={e => setAddressForm({ ...addressForm, recipient_name: e.target.value })} required autoComplete="name" /></label>
                <label>Phone number<input type="tel" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} required autoComplete="tel" /></label>
                <label>Address line 1<input value={addressForm.address_line1} onChange={e => setAddressForm({ ...addressForm, address_line1: e.target.value })} required autoComplete="address-line1" /></label>
                <label>Address line 2 <span className="customer-optional">(optional)</span><input value={addressForm.address_line2} onChange={e => setAddressForm({ ...addressForm, address_line2: e.target.value })} autoComplete="address-line2" /></label>
                <label>City<input value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} required autoComplete="address-level2" /></label>
                <label>State / region<input value={addressForm.state_region} onChange={e => setAddressForm({ ...addressForm, state_region: e.target.value })} autoComplete="address-level1" /></label>
                <label>Postal code <span className="customer-optional">(optional)</span><input value={addressForm.postal_code} onChange={e => setAddressForm({ ...addressForm, postal_code: e.target.value })} autoComplete="postal-code" /></label>
                <label>Country<input value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })} required autoComplete="country-name" /></label>
              </div>
              <label className="customer-default-checkbox"><input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} /> Set as my default delivery address</label>
              <button className="customer-primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save address'} <span aria-hidden="true">→</span></button>
            </form>
          </section>



          <section id="support" className="customer-account-section">
            <div className="customer-section-topline"><span>04 / WE ARE HERE</span><span>CUSTOMER CARE</span></div>
            <div className="customer-section-heading"><div><h2>Customer support</h2><p>Send a message to the VendraHub support team. We’ll keep your requests here.</p></div><span className="customer-section-symbol" aria-hidden="true">✉</span></div>
            <form className="customer-modern-form" onSubmit={submitTicket}>
              <label>Subject<input value={subject} minLength={3} maxLength={160} onChange={e => setSubject(e.target.value)} required placeholder="What can we help you with?" /></label>
              <label>Message<textarea value={message} minLength={10} maxLength={5000} rows={5} onChange={e => setMessage(e.target.value)} required placeholder="Tell us a little more about your question…" /></label>
              <div className="customer-form-bottom"><small>{message.length}/5000 characters</small><button className="customer-primary-button" disabled={busy}>{busy ? 'Submitting…' : 'Submit support request'} <span aria-hidden="true">→</span></button></div>
            </form>
            <div className="customer-history-heading"><h3>Your support history</h3><span>{tickets.length} {tickets.length === 1 ? 'REQUEST' : 'REQUESTS'}</span></div>
            {tickets.length ? <ul className="customer-support-list">{tickets.map(ticket => <li key={ticket.id}><div><strong>{ticket.subject}</strong><small>Submitted {new Date(ticket.created_at).toLocaleDateString()}</small></div><span className="customer-ticket-status">{ticket.status.replaceAll('_', ' ')}</span></li>)}</ul> : <p className="customer-inline-empty">No support requests yet.</p>}
          </section>


        </div>
      </div>
      <footer className="customer-account-footer"><Link href="/customer">VENDRAHUB</Link><span>SHOP SMART. LIVE STYLISH.</span><a href="#profile">Back to top ↑</a></footer>
      <CustomerBottomNav active="Account" />
    </main>
  );
}
