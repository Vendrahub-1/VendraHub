import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePricingRecommendation } from '@/lib/ai-pricing-recommendation';
import type { PricingInput } from '@/lib/pricing';

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
      productTitle?: string;
      category?: string;
      market?: string;
      pricing?: PricingInput;
    };
    if (!body.pricing) return NextResponse.json({ error: 'Pricing inputs are required.' }, { status: 400 });
    const result = await generatePricingRecommendation({
      productTitle: body.productTitle ?? '',
      category: body.category,
      market: body.market ?? '',
      pricing: body.pricing,
    });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI recommendation failed.';
    const status = message.includes('not configured') ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
