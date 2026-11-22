'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const OWNER_EMAIL = 'vendrahub@hotmail.com';

export default function AdminRecoveryPage() {
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
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/admin/reset-password')}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(OWNER_EMAIL, { redirectTo });
      if (resetError) throw resetError;
      setNotice('If the owner account exists, Supabase has queued a password-reset email. Check the inbox and spam folder.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not request a password reset. Check the Supabase SMTP configuration.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell"><section className="auth-card">
    <Link href="/" className="auth-brand"><Image src="/vendrahub-logo.svg" alt="VendraHub" width={250} height={73} priority /></Link>
    <Link href="/admin/login" className="auth-back">← Admin sign in</Link>
    <p className="auth-kicker">PRIVATE OWNER ACCESS</p><h1>Reset owner password</h1>
    <p className="auth-description">A secure reset link will be sent to the designated owner account. The admin workspace remains protected by email verification and MFA.</p>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="auth-description" role="status">{notice}</p>}
    <form onSubmit={submit} className="auth-form">
      <label htmlFor="owner-email">Owner account</label>
      <input id="owner-email" type="email" value={OWNER_EMAIL} readOnly />
      <button type="submit" disabled={busy}>{busy ? 'Requesting reset…' : 'Send password reset email'}</button>
    </form>
  </section></main>;
}
