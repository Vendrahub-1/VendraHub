'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import SignOutButton from '@/components/sign-out-button';

type Profile = { full_name: string | null; avatar_url?: string | null };
type Ticket = { id: string; subject: string; status: string; created_at: string };
type WishlistItem = { id: string; shopify_product_gid: string; created_at: string };
type Address = { id: string; label: string; recipient_name: string; phone: string; address_line1: string; address_line2: string | null; city: string; state_region: string | null; postal_code: string | null; country: string; is_default: boolean };

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
  const [addressForm, setAddressForm] = useState({ label: 'Home', recipient_name: '', phone: '', address_line1: '', address_line2: '', city: '', state_region: '', postal_code: '', country: 'Nigeria', is_default: true });

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.assign('/customer/login'); return; }
    setEmail(user.email ?? '');
    const [p, t, w, a] = await Promise.all([
      supabase.from('profiles').select('full_name,avatar_url').eq('id', user.id).maybeSingle(),
      fetch('/api/customer/support', { cache: 'no-store' }),
      fetch('/api/customer/wishlist', { cache: 'no-store' }),
      fetch('/api/customer/addresses', { cache: 'no-store' }),
    ]);
    if (p.data) setProfile(p.data);
    if (t.ok) { const v = await t.json(); setTickets(v.tickets ?? []); }
    if (w.ok) { const v = await w.json(); setWishlist(v.items ?? []); }
    if (a.ok) { const v = await a.json(); setAddresses(v.addresses ?? []); }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function saveProfile(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: profile.full_name }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update profile.');
      setProfile(data.profile); setNotice('Profile updated.');
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
      setAddressForm({ label: 'Home', recipient_name: '', phone: '', address_line1: '', address_line2: '', city: '', state_region: '', postal_code: '', country: 'Nigeria', is_default: false });
      setNotice('Delivery address saved.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save address.'); }
    finally { setBusy(false); }
  }

  async function removeAddress(id: string) {
    const response = await fetch('/api/customer/addresses?id=' + encodeURIComponent(id), { method: 'DELETE' });
    if (!response.ok) { setError('Could not remove address.'); return; }
    setAddresses(current => current.filter(x => x.id !== id)); setNotice('Address removed.');
  }

  async function removeWishlist(gid: string) {
    const response = await fetch('/api/customer/wishlist?product=' + encodeURIComponent(gid), { method: 'DELETE' });
    if (!response.ok) { setError('Could not remove wishlist item.'); return; }
    setWishlist(current => current.filter(x => x.shopify_product_gid !== gid)); setNotice('Wishlist item removed.');
  }

  if (loading) return <main className="session-page"><p>Loading your account…</p></main>;

  return <main className="session-page customer-theme customer-portal">
    <header className="topbar"><Link href="/" className="crumb-link">← Storefront</Link><SignOutButton /></header>
    <section className="hero-panel intro-panel"><div><p className="eyebrow">VENDRAHUB CUSTOMER ACCOUNT</p><h1>Welcome{profile.full_name ? `, ${profile.full_name}` : ''}</h1><p>{email}</p></div><span className="session-pill">Customer</span></section>
    {notice && <p className="customer-notice" role="status">{notice}</p>}{error && <p className="auth-error" role="alert">{error}</p>}
    <nav className="customer-nav"><a href="#profile">Profile</a><a href="#addresses">Delivery addresses</a><a href="#wishlist">Wishlist</a><a href="#support">Support</a><a href="#orders">Orders</a></nav>
    <section id="profile" className="customer-section"><div className="section-heading"><h2>Personal details</h2><p>Keep your contact details up to date.</p></div><form className="customer-form" onSubmit={saveProfile}><label>Full name<input value={profile.full_name ?? ''} maxLength={120} onChange={e=>setProfile({ ...profile, full_name: e.target.value })} required /></label><label>Email address<input value={email} disabled /></label><button disabled={busy}>Save profile</button></form></section>
    <section id="addresses" className="customer-section"><div className="section-heading"><h2>Delivery addresses</h2><p>Manage where your orders should be delivered.</p></div><div className="customer-card-grid">{addresses.map(a=><article className="customer-data-card" key={a.id}><div className="customer-card-title"><strong>{a.label}</strong>{a.is_default && <span className="state">Default</span>}</div><p>{a.recipient_name} · {a.phone}</p><p>{a.address_line1}{a.address_line2 ? ', ' + a.address_line2 : ''}, {a.city}{a.state_region ? ', ' + a.state_region : ''}, {a.country} {a.postal_code ?? ''}</p><button type="button" className="text-button" onClick={()=>removeAddress(a.id)}>Remove</button></article>)}</div><form className="customer-form customer-address-form" onSubmit={addAddress}><h3>Add an address</h3><div className="customer-form-grid"><label>Label<input value={addressForm.label} onChange={e=>setAddressForm({...addressForm,label:e.target.value})} required /></label><label>Recipient name<input value={addressForm.recipient_name} onChange={e=>setAddressForm({...addressForm,recipient_name:e.target.value})} required /></label><label>Phone<input type="tel" value={addressForm.phone} onChange={e=>setAddressForm({...addressForm,phone:e.target.value})} required /></label><label>Address line 1<input value={addressForm.address_line1} onChange={e=>setAddressForm({...addressForm,address_line1:e.target.value})} required /></label><label>Address line 2<input value={addressForm.address_line2} onChange={e=>setAddressForm({...addressForm,address_line2:e.target.value})} /></label><label>City<input value={addressForm.city} onChange={e=>setAddressForm({...addressForm,city:e.target.value})} required /></label><label>State / region<input value={addressForm.state_region} onChange={e=>setAddressForm({...addressForm,state_region:e.target.value})} /></label><label>Postal code<input value={addressForm.postal_code} onChange={e=>setAddressForm({...addressForm,postal_code:e.target.value})} /></label><label>Country<input value={addressForm.country} onChange={e=>setAddressForm({...addressForm,country:e.target.value})} required /></label></div><label className="customer-check"><input type="checkbox" checked={addressForm.is_default} onChange={e=>setAddressForm({...addressForm,is_default:e.target.checked})} /> Set as default delivery address</label><button disabled={busy}>Save address</button></form></section>
    <section id="wishlist" className="customer-section"><div className="section-heading"><h2>Wishlist</h2><p>Products you have saved for later.</p></div>{wishlist.length ? <ul className="customer-list">{wishlist.map(item=><li key={item.id}><span>{item.shopify_product_gid}</span><button type="button" className="text-button" onClick={()=>removeWishlist(item.shopify_product_gid)}>Remove</button></li>)}</ul> : <p className="customer-empty">Your wishlist is empty.</p>}</section>
    <section id="support" className="customer-section"><div className="section-heading"><h2>Customer support</h2><p>Send a message to the VendraHub support team.</p></div><form className="customer-form" onSubmit={submitTicket}><label>Subject<input value={subject} minLength={3} maxLength={160} onChange={e=>setSubject(e.target.value)} required /></label><label>Message<textarea value={message} minLength={10} maxLength={5000} rows={5} onChange={e=>setMessage(e.target.value)} required /></label><button disabled={busy}>Submit support request</button></form><h3 className="customer-subheading">Your support history</h3>{tickets.length ? <ul className="customer-list">{tickets.map(t=><li key={t.id}><div><strong>{t.subject}</strong><small>{t.status.replaceAll('_',' ')} · {new Date(t.created_at).toLocaleDateString()}</small></div></li>)}</ul> : <p className="customer-empty">No support requests yet.</p>}</section>
    <section id="orders" className="customer-section"><div className="section-heading"><h2>Order history</h2><p>Order tracking will appear here after the Shopify customer/order integration is authorised.</p></div><p className="customer-empty">Shopify order access is not connected yet. No order data is being simulated.</p></section>
  </main>;
}
