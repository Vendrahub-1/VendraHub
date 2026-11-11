'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('VendraHub@hotmail.com');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError || !data.user) throw new Error('Sign-in failed. Check the owner email, password and email verification.');
      if (data.user.email?.toLowerCase() !== 'vendrahub@hotmail.com' || !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error('This account is not the verified VendraHub owner account.');
      }
      const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      router.replace(level.currentLevel === 'aal2' ? '/admin' : '/admin/mfa');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell"><section className="auth-card">
    <Link href="/" className="auth-back">← VendraHub storefront</Link>
    <p className="auth-kicker">PRIVATE OWNER ACCESS</p><h1>Admin sign in</h1>
    <p className="auth-description">Only the verified owner account can enter the administration workspace. Authenticator verification is required.</p>
    {params.get('error') === 'configuration' && <p className="auth-error">Supabase configuration is missing. Add the required GitHub Actions variables and runtime environment values.</p>}
    {params.get('error') === 'not_authorised' && <p className="auth-error">This account is not authorised for owner administration.</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <form onSubmit={submit} className="auth-form">
      <label htmlFor="owner-email">Owner email</label><input id="owner-email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required />
      <label htmlFor="owner-password">Password</label><input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required />
      <button type="submit" disabled={busy}>{busy ? 'Checking credentials…' : 'Continue securely'}</button>
    </form>
    <p className="auth-footnote">Do not create a new owner account from this screen. The account must first be created and email-verified in Supabase Auth.</p>
  </section></main>;
}
