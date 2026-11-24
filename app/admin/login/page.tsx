'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const OWNER_EMAIL = 'vendrahub@hotmail.com';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        const message = signInError.message.toLowerCase();
        if (message.includes('invalid login credentials') || message.includes('email not confirmed')) {
          throw new Error('Supabase did not accept this login. Check the owner email and password.');
        }
        throw signInError;
      }
      if (!data.user) throw new Error('Supabase did not return an authenticated user.');
      if (data.user.email?.toLowerCase() !== OWNER_EMAIL) {
        await supabase.auth.signOut();
        throw new Error('This account is not the designated VendraHub owner account.');
      }
      const { data: level, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfaError) throw mfaError;
      router.replace(level?.currentLevel === 'aal2' ? '/admin' : '/admin/mfa');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell"><section className="auth-card">
    <Link href="/admin/login" className="auth-brand"><Image src="/vendrahub-logo.svg" alt="VendraHub — Shop Smart. Live Stylish." width={250} height={73} priority /></Link>
    <Link href="/admin/login" className="auth-back">← Admin portal</Link>
    <p className="auth-kicker">PRIVATE OWNER ACCESS</p><h1>Admin sign in</h1>
    <p className="auth-description">Only the designated owner account can enter the administration workspace. Password and authenticator-based MFA are required.</p>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="auth-description" role="status">{notice}</p>}
    <form onSubmit={submit} className="auth-form">
      <label htmlFor="owner-email">Owner email</label><input id="owner-email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required />
      <label htmlFor="owner-password">Password</label><input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required />
      <button type="submit" disabled={busy}>{busy ? 'Checking credentials…' : 'Continue securely'}</button>
    </form>
    <div className="auth-footnote">
      <p><Link href="/admin/recover">Forgot owner password?</Link></p>
    </div>
  </section></main>;
}
