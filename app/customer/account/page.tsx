import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/sign-out-button';

export const dynamic = 'force-dynamic';

export default async function CustomerAccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/customer/login');

  const [{ data: profile }, { data: tickets }, { data: wishlist }] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url, created_at').eq('id', user.id).maybeSingle(),
    supabase.from('support_tickets').select('id, subject, status, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('wishlist_items').select('id, shopify_product_gid, created_at').order('created_at', { ascending: false }).limit(20),
  ]);

  return <main className="session-page customer-theme">
    <header className="topbar"><Link href="/" className="crumb-link">← Storefront</Link><SignOutButton /></header>
    <section className="hero-panel intro-panel"><div><p className="eyebrow">VENDRAHUB CUSTOMER ACCOUNT</p><h1>Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}</h1><p>{user.email}</p></div><span className="session-pill">Customer</span></section>
    <section className="content-grid">
      <article className="panel"><h2>Support requests</h2>{tickets?.length ? <ul className="stack-list">{tickets.map(t=><li key={t.id}><strong>{t.subject}</strong><span>{t.status.replaceAll('_',' ')} · {new Date(t.created_at).toLocaleDateString()}</span></li>)}</ul> : <p>No support requests yet.</p>}</article>
      <article className="panel"><h2>Wishlist</h2>{wishlist?.length ? <ul className="stack-list">{wishlist.map(w=><li key={w.id}>{w.shopify_product_gid}</li>)}</ul> : <p>Your saved products will appear here.</p>}</article>
    </section>
  </main>;
}
