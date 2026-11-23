import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_RECOVERY_COOKIE, verifyAdminRecoveryProof } from '@/lib/admin-recovery';

export const dynamic = 'force-dynamic';

const OWNER_EMAIL = 'vendrahub@hotmail.com';

async function verifiedRecoveryClient() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const validProof = user && await verifyAdminRecoveryProof(
    cookieStore.get(ADMIN_RECOVERY_COOKIE)?.value,
    user.id,
    process.env.ADMIN_RECOVERY_COOKIE_SECRET,
  );
  if (error || !user || user.email?.toLowerCase() !== OWNER_EMAIL || !validProof) return null;
  return supabase;
}

export async function GET() {
  const supabase = await verifiedRecoveryClient();
  if (!supabase) return NextResponse.json({ error: 'A verified owner recovery link is required.' }, { status: 403 });
  return NextResponse.json({ valid: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request) {
  const supabase = await verifiedRecoveryClient();
  if (!supabase) return NextResponse.json({ error: 'A verified owner recovery link is required.' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'A valid JSON request is required.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || !('password' in body) || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'A new password is required.' }, { status: 400 });
  }
  if (body.password.length < 12 || body.password.length > 128) {
    return NextResponse.json({ error: 'Use a password between 12 and 128 characters.' }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({ password: body.password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.auth.signOut();
  const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  response.cookies.set(ADMIN_RECOVERY_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
