import { NextRequest, NextResponse } from 'next/server';
import {
  searchShopifyProducts,
  ShopifyConfigurationError,
} from '@/lib/shopify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('q') ?? '';
  const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? '20');
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 20) : 20;

  try {
    const products = await searchShopifyProducts(search, limit);
    return NextResponse.json({ products }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    if (error instanceof ShopifyConfigurationError) {
      return NextResponse.json(
        { error: 'Shopify storefront is not configured.' },
        { status: 503 },
      );
    }

    console.error('Shopify product request failed:', error);
    return NextResponse.json(
      { error: 'Could not load products from Shopify.' },
      { status: 502 },
    );
  }
}
