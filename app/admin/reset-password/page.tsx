'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const OWNER_EMAIL = 'vendrahub@hotmail.com';

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!active) return;
      if (userError || user?.email?.toLowerCase() !== OWNER_EMAIL) {
        setError('This password-reset session is invalid or has expired. Request a new reset email.');
        return;
      }
      setReady(true);
    })();
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (password.length < 12) {
      setError('Use at least 12 characters for the new owner password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The password confirmation does not match.');
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setNotice('Your owner password has been updated. Sign in again, then complete authenticator verification.');
      window.setTimeout(() => {
        router.replace('/admin/login?password_reset=success');
        router.refresh();
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the owner password.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell"><section className="auth-card">
    <Link href="/admin/login" className="auth-back">← Admin sign in</Link>
    <p className="auth-kicker">PRIVATE OWNER ACCESS</p><h1>Choose a new password</h1>
    <p className="auth-description">This page accepts only a valid recovery session for the designated owner account.</p>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="auth-description" role="status">{notice}</p>}
    {ready && <form onSubmit={submit} className="auth-form">
      <label htmlFor="new-password">New password</label>
      <input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} required />
      <label htmlFor="confirm-password">Confirm new password</label>
      <input id="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
      <button type="submit" disabled={busy}>{busy ? 'Updating password…' : 'Update owner password'}</button>
    </form>}
  </section></main>;
}
