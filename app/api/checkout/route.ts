import { NextResponse } from 'next/server';
import { createShopifyCheckout } from '@/lib/shopify-cart';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (process.env.CHECKOUT_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Checkout is disabled while the VendraHub platform is being tested.' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }

  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  try {
    const body = await request.json() as { lines?: Array<{ merchandiseId: string; quantity: number }> };
    const result = await createShopifyCheckout(body.lines ?? []);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start checkout.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
