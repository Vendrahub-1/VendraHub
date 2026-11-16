import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculatePricing, type PricingInput } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || user.email?.toLowerCase() !== 'vendrahub@hotmail.com' || !user.email_confirmed_at) {
    return NextResponse.json({ error: 'Owner access only.' }, { status: 403 });
  }

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== 'aal2') {
    return NextResponse.json({ error: 'Authenticator verification required.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'A valid JSON request is required.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Pricing input must be an object.' }, { status: 400 });
  }

  try {
    const result = calculatePricing(body as PricingInput);
    return NextResponse.json({ result }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid pricing input.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
