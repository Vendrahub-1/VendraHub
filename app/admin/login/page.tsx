'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const OWNER_EMAIL = 'vendrahub@hotmail.com';

function callbackUrl(next: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
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
          throw new Error('Supabase did not accept this login. Check the owner password. If the owner email has not been verified, use “Resend verification email” below.');
        }
        throw signInError;
      }
      if (!data.user) throw new Error('Supabase did not return an authenticated user.');
      if (data.user.email?.toLowerCase() !== OWNER_EMAIL) {
        await supabase.auth.signOut();
        throw new Error('This account is not the designated VendraHub owner account.');
      }
      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error('The owner email is not verified yet. Use “Resend verification email” below.');
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

  async function resendVerification() {
    setResending(true);
    setError('');
    setNotice('');
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: OWNER_EMAIL,
        options: { emailRedirectTo: callbackUrl('/admin/mfa') },
      });
      if (resendError) throw resendError;
      setNotice('If the owner account is awaiting verification, Supabase has queued a new confirmation email. Check the inbox and spam folder.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resend the verification email. Check the Supabase SMTP configuration.');
    } finally {
      setResending(false);
    }
  }

  return <main className="auth-shell"><section className="auth-card">
    <Link href="/" className="auth-brand"><Image src="/vendrahub-logo.svg" alt="VendraHub — Shop Smart. Live Stylish." width={250} height={73} priority /></Link>
    <Link href="/" className="auth-back">← VendraHub home</Link>
    <p className="auth-kicker">PRIVATE OWNER ACCESS</p><h1>Admin sign in</h1>
    <p className="auth-description">Only the designated owner account can enter the administration workspace. Email verification and authenticator-based MFA are required.</p>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="auth-description" role="status">{notice}</p>}
    <form onSubmit={submit} className="auth-form">
      <label htmlFor="owner-email">Owner email</label><input id="owner-email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required />
      <label htmlFor="owner-password">Password</label><input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required />
      <button type="submit" disabled={busy}>{busy ? 'Checking credentials…' : 'Continue securely'}</button>
    </form>
    <div className="auth-footnote">
      <p><Link href="/admin/recover">Forgot owner password?</Link></p>
      <p>Still waiting for the confirmation email? <button type="button" disabled={resending} onClick={resendVerification}>{resending ? 'Sending…' : 'Resend verification email'}</button></p>
    </div>
  </section></main>;
}
