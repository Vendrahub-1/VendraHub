'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Factor = { id: string; status: string; factor_type: string };

export default function AdminMfaPage() {
  const router = useRouter();
  const [factor, setFactor] = useState<Factor | null>(null);
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user || user.email?.toLowerCase() !== 'vendrahub@hotmail.com') {
          router.replace('/admin/login');
          return;
        }

        const { data: level, error: levelError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (levelError) throw levelError;
        if (level?.currentLevel === 'aal2') {
          router.replace('/admin');
          return;
        }

        const { data, error: listError } = await supabase.auth.mfa.listFactors();
        if (listError) throw listError;

        const verified = data.totp.find(item => item.status === 'verified');
        if (verified) {
          if (active) {
            setFactor(verified);
            setFactorId(verified.id);
            setMessage('Enter the current six-digit code from your registered authenticator app.');
          }
          return;
        }

        // An unverified factor cannot complete login and its original QR secret
        // is not returned by listFactors(). Remove only that unfinished factor,
        // then issue a fresh enrollment QR code. Never remove a verified factor.
        const unfinished = data.totp.filter(item => String(item.status) === 'unverified');
        for (const pending of unfinished) {
          const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: pending.id });
          if (removeError) throw new Error('Could not safely reset the unfinished authenticator setup. Please retry or contact support.');
        }

        const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'VendraHub owner authenticator',
        });
        if (enrollError) throw enrollError;
        if (active) {
          setFactorId(enrolled.id);
          setQr(enrolled.totp.qr_code);
          setSecret(enrolled.totp.secret);
          setMessage('Scan the QR code with an authenticator app, or enter the setup key manually. Then enter the six-digit code to activate MFA.');
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not initialise MFA.');
      }
    })();
    return () => { active = false; };
  }, [router]);

  async function verify() {
    setBusy(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.replace(/\s/g, ''),
      });
      if (verifyError) throw verifyError;
      const { data: level, error: levelError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (levelError) throw levelError;
      if (level?.currentLevel !== 'aal2') throw new Error('Authenticator verification did not establish AAL2.');
      router.replace('/admin');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authenticator verification failed.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell"><section className="auth-card">
    <Link href="/admin/login" className="auth-back">← Admin sign in</Link>
    <p className="auth-kicker">MULTI-FACTOR SECURITY</p><h1>Authenticator verification</h1>
    {message && <p className="auth-description">{message}</p>}
    {qr && <div className="mfa-qr"><img src={qr} alt="Authenticator enrolment QR code" /><p>Manual setup key</p><code>{secret}</code></div>}
    {factor && <p className="auth-description">Your registered authenticator is ready. Enter its current six-digit code.</p>}
    {factorId && <div className="auth-form"><label htmlFor="totp-code">Six-digit authenticator code</label><input id="totp-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} /><button type="button" disabled={busy || code.length !== 6} onClick={verify}>{busy ? 'Verifying…' : 'Verify and open admin'}</button></div>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {!factorId && !error && <p className="auth-footnote">MFA setup is being prepared. Admin access remains blocked until AAL2 is verified.</p>}
  </section></main>;
}
