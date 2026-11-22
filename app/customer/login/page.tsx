'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
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
  const [resending, setResending] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  function explainAuthError(value: unknown) {
    const message = value instanceof Error ? value.message : 'Unable to complete the request.';
    const normalized = message.toLowerCase();
    if (normalized.includes('sending confirmation email') || normalized.includes('smtp') || normalized.includes('too many colons in address')) {
      setNeedsConfirmation(true);
      return 'Your account request reached VendraHub, but the confirmation email could not be delivered because the authentication email server is being corrected. Please try again after email service is restored.';
    }
    if (normalized.includes('invalid login credentials')) {
      return 'The email or password is incorrect, or this email address has not been verified. Check your details or request another confirmation email.';
    }
    return message;
  }

  async function resendConfirmation() {
    setResending(true);
    setError('');
    setNotice('');
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/customer/account` },
      });
      if (resendError) throw resendError;
      setNotice('A confirmation email has been requested. Check your inbox and spam folder.');
    } catch (e) {
      setError(explainAuthError(e));
    } finally {
      setResending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    setNeedsConfirmation(false);
    try {
      const supabase = createClient();
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/customer/account`,
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          router.replace('/customer/account');
          router.refresh();
        } else {
          setNeedsConfirmation(true);
          setNotice('Your account has been created. Verify your email using the confirmation link before signing in.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) throw signInError;
        router.replace('/customer/account');
        router.refresh();
      }
    } catch (e) {
      setError(explainAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell"><section className="auth-card">
    <Link href="/customer" className="auth-brand"><Image src="/vendrahub-logo.svg" alt="VendraHub — Shop Smart. Live Stylish." width={250} height={73} priority /></Link>
    <Link href="/customer" className="auth-back">← Back to storefront</Link>
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
    {needsConfirmation && <button type="button" className="auth-secondary-button" onClick={resendConfirmation} disabled={resending || !email.trim()}>{resending ? 'Requesting email…' : 'Resend confirmation email'}</button>}
    <p className="auth-footnote">{mode === 'signin' ? 'New to VendraHub? ' : 'Already have an account? '}<button type="button" onClick={()=>{setMode(mode === 'signin' ? 'signup' : 'signin');setError('');setNotice('');setNeedsConfirmation(false);}}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></p>
  </section></main>;
}
