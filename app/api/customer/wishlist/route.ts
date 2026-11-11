import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Authentication required.' }, 401);
  const { data, error } = await supabase.from('wishlist_items').select('id,shopify_product_gid,created_at').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return json({ error: 'Could not load wishlist.' }, 500);
  return json({ items: data });
}
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Authentication required.' }, 401);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const gid = body && typeof body === 'object' ? (body as { shopify_product_gid?: unknown }).shopify_product_gid : null;
  if (typeof gid !== 'string' || gid.length < 1 || gid.length > 255 || !gid.startsWith('gid://shopify/Product/')) return json({ error: 'A valid Shopify product id is required.' }, 400);
  const { data, error } = await supabase.from('wishlist_items').upsert({ user_id: user.id, shopify_product_gid: gid }, { onConflict: 'user_id,shopify_product_gid' }).select('id,shopify_product_gid,created_at').single();
  if (error) return json({ error: 'Could not save wishlist item.' }, 400);
  return json({ item: data }, 201);
}
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Authentication required.' }, 401);
  const gid = request.nextUrl.searchParams.get('product');
  if (!gid) return json({ error: 'Product id is required.' }, 400);
  const { error } = await supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('shopify_product_gid', gid);
  if (error) return json({ error: 'Could not remove wishlist item.' }, 400);
  return json({ success: true });
}
