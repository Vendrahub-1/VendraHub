import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getExchangeRates } from '@/lib/exchange-rates';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== 'vendrahub@hotmail.com' || !user.email_confirmed_at) {
    return NextResponse.json({ error: 'Owner access only.' }, { status: 403 });
  }
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== 'aal2') {
    return NextResponse.json({ error: 'Authenticator verification required.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const base = url.searchParams.get('base') ?? 'NGN';
  try {
    const snapshot = await getExchangeRates(base);
    return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not retrieve exchange rates.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
