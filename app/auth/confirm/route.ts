import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_RECOVERY_COOKIE, ADMIN_RECOVERY_TTL_SECONDS, createAdminRecoveryProof } from '@/lib/admin-recovery';

const OWNER_EMAIL = 'vendrahub@hotmail.com';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const secret = process.env.ADMIN_RECOVERY_COOKIE_SECRET;

  const fail = (reason: 'expired' | 'config' = 'expired') =>
    NextResponse.redirect(new URL(`/admin/recover?error=${reason}`, origin));

  if (!secret || secret.length < 32) return fail('config');
  if (!tokenHash || type !== 'recovery') return fail('expired');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'recovery',
  });
  if (error || data.user?.email?.toLowerCase() !== OWNER_EMAIL || !data.user.id) {
    return fail('expired');
  }

  const proof = await createAdminRecoveryProof(data.user.id, secret);
  const response = NextResponse.redirect(new URL('/admin/reset-password', origin));
  response.cookies.set(ADMIN_RECOVERY_COOKIE, proof, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_RECOVERY_TTL_SECONDS,
  });
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
