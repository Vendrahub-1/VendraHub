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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.email?.toLowerCase() !== 'vendrahub@hotmail.com' || !user.email_confirmed_at) {
          router.replace('/admin/login');
          return;
        }
        const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (level?.currentLevel === 'aal2') { router.replace('/admin'); return; }
        const { data, error: listError } = await supabase.auth.mfa.listFactors();
        if (listError) throw listError;
        const verified = data.totp.find(item => item.status === 'verified');
        if (verified) {
          if (active) { setFactor(verified); setFactorId(verified.id); }
          return;
        }
        const unverified = data.totp.find(item => (item.status as string) === 'unverified');
        if (unverified) {
          if (active) setMessage('There is an unfinished authenticator setup. Contact the project owner to safely clear only the unverified setup before enrolling again.');
          return;
        }
        const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'VendraHub owner authenticator' });
        if (enrollError) throw enrollError;
        if (active) {
          setFactorId(enrolled.id);
          setQr(enrolled.totp.qr_code);
          setSecret(enrolled.totp.secret);
          setMessage('Scan the QR code with an authenticator app, or enter the setup key manually. Then enter the six-digit code.');
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not initialise MFA.');
      }
    })();
    return () => { active = false; };
  }, [router]);

  async function verify() {
    setBusy(true); setError('');
    try {
      const supabase = createClient();
      let challengeId = '';
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      challengeId = challenge.id;
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId, code: code.replace(/\s/g, '') });
      if (verifyError) throw verifyError;
      const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (level?.currentLevel !== 'aal2') throw new Error('Authenticator verification did not establish AAL2.');
      router.replace('/admin'); router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authenticator verification failed.');
    } finally { setBusy(false); }
  }

  return <main className="auth-shell"><section className="auth-card">
    <Link href="/admin/login" className="auth-back">← Admin sign in</Link>
    <p className="auth-kicker">MULTI-FACTOR SECURITY</p><h1>Authenticator verification</h1>
    {message && <p className="auth-description">{message}</p>}
    {qr && <div className="mfa-qr"><img src={qr} alt="Authenticator enrolment QR code" /><p>Manual setup key</p><code>{secret}</code></div>}
    {factor && <p className="auth-description">Enter the current six-digit code from your registered authenticator app.</p>}
    {factorId && <div className="auth-form"><label htmlFor="totp-code">Six-digit authenticator code</label><input id="totp-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} /><button type="button" disabled={busy || code.length !== 6} onClick={verify}>{busy ? 'Verifying…' : 'Verify and open admin'}</button></div>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {!factorId && !error && <p className="auth-footnote">MFA setup is awaiting a safe enrolment state. No access is granted until AAL2 is verified.</p>}
  </section></main>;
}
