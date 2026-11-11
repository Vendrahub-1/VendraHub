import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ authenticated: false }, { status: 401 });
  if (user.email?.toLowerCase() !== 'vendrahub@hotmail.com' || !user.email_confirmed_at) {
    return NextResponse.json({ authenticated: false }, { status: 403 });
  }
  const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (level.currentLevel !== 'aal2') return NextResponse.json({ authenticated: false, mfaRequired: true }, { status: 403 });
  return NextResponse.json({ authenticated: true, email: user.email, assuranceLevel: level.currentLevel }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
