'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const supabase = createClient();
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/customer/account` },
        });
        if (signUpError) throw signUpError;
        if (data.session) { router.replace('/customer/account'); router.refresh(); }
        else setNotice('Account request received. Check your email to verify the address before signing in.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        router.replace('/customer/account'); router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to complete the request.');
    } finally { setBusy(false); }
  }

  return <main className="auth-shell"><section className="auth-card">
    <Link href="/" className="auth-back">← VendraHub storefront</Link>
    <p className="auth-kicker">CUSTOMER ACCOUNT</p><h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
    <p className="auth-description">Sign in to manage your profile, wishlist and support requests.</p>
    {notice && <p className="auth-description" role="status">{notice}</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <form className="auth-form" onSubmit={submit}>
      {mode === 'signup' && <><label htmlFor="customer-name">Full name</label><input id="customer-name" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={120} required /></>}
      <label htmlFor="customer-email">Email</label><input id="customer-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required />
      <label htmlFor="customer-password">Password</label><input id="customer-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required />
      <button type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
    </form>
    <p className="auth-footnote">{mode === 'signin' ? 'New to VendraHub? ' : 'Already have an account? '}<button type="button" onClick={()=>{setMode(mode === 'signin' ? 'signup' : 'signin');setError('');setNotice('');}}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></p>
  </section></main>;
}
