import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCjProductAndShippingQuote } from '@/lib/cj-dropshipping';

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
    const body = await request.json() as {
      productId?: string;
      variantId?: string;
      originCountryCode?: string;
      destinationCountryCode?: string;
      quantity?: number;
    };
    const quote = await getCjProductAndShippingQuote({
      productId: body.productId ?? '',
      variantId: body.variantId ?? '',
      originCountryCode: (body.originCountryCode ?? '').toUpperCase(),
      destinationCountryCode: (body.destinationCountryCode ?? '').toUpperCase(),
      quantity: body.quantity ?? 1,
    });
    return NextResponse.json({ quote, productImported: false, orderPlaced: false }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'CJ quote request failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
