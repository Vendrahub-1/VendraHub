import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyseBulkPricing, type BulkPricingItem } from '@/lib/pricing-bulk';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== 'vendrahub@hotmail.com' || !user.email_confirmed_at) {
    return NextResponse.json({ error: 'Owner access only.' }, { status: 403 });
  }
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== 'aal2') {
    return NextResponse.json({ error: 'Authenticator verification required.' }, { status: 403 });
  }

  try {
    const body = await request.json() as { items?: BulkPricingItem[] };
    const results = analyseBulkPricing(body.items ?? []);
    return NextResponse.json({ results, updatesApplied: false }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bulk analysis failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
