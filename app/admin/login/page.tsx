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
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function resendOwnerVerification() {
    setResending(true);
    setError('');
    setNotice('');
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: OWNER_EMAIL,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin` },
      });
      if (resendError) throw resendError;
      setNotice('If the owner account is awaiting verification, a new confirmation email has been requested. Check the inbox and spam folder.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not request a new confirmation email.';
      setError(message.toLowerCase().includes('sending confirmation email') || message.toLowerCase().includes('smtp')
        ? 'The authentication email service is currently misconfigured. The project owner must correct the SMTP settings before verification emails can be delivered.'
        : message);
    } finally {
      setResending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (signInError) {
        if (signInError.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('The owner email or password is incorrect, or the owner email has not been verified. Use the verification option below if this is the first owner sign-in.');
        }
        throw signInError;
      }
      if (!data.user) throw new Error('Supabase did not return an authenticated user.');
      if (data.user.email?.toLowerCase() !== OWNER_EMAIL || !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error('This account is not the verified VendraHub owner account. Verify the designated owner email before continuing.');
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
    <Link href="/" className="auth-brand"><Image src="/vendrahub-logo.svg" alt="VendraHub — Shop Smart. Live Stylish." width={250} height={73} priority /></Link>
    <Link href="/" className="auth-back">← VendraHub home</Link>
    <p className="auth-kicker">PRIVATE OWNER ACCESS</p><h1>Admin sign in</h1>
    <p className="auth-description">Only the verified owner account can enter the administration workspace. Authenticator verification is required.</p>
    {notice && <p className="auth-description" role="status">{notice}</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <form onSubmit={submit} className="auth-form">
      <label htmlFor="owner-email">Owner email</label><input id="owner-email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required />
      <label htmlFor="owner-password">Password</label><input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required />
      <button type="submit" disabled={busy}>{busy ? 'Checking credentials…' : 'Continue securely'}</button>
    </form>
    <button type="button" className="auth-secondary-button" onClick={resendOwnerVerification} disabled={resending}>{resending ? 'Requesting email…' : 'Resend owner verification email'}</button>
    <p className="auth-footnote">Do not create a new owner account from this screen. The designated owner account must be email-verified, then complete authenticator verification.</p>
  </section></main>;
}
