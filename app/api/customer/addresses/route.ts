import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Authentication required.' }, 401);
  const { data, error } = await supabase.from('customer_addresses').select('id,label,recipient_name,phone,address_line1,address_line2,city,state_region,postal_code,country,is_default,created_at').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false });
  if (error) return json({ error: 'Could not load addresses.' }, 500);
  return json({ addresses: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Authentication required.' }, 401);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const fields = ['label','recipient_name','phone','address_line1','address_line2','city','state_region','postal_code','country'] as const;
  for (const key of ['recipient_name','phone','address_line1','city','country'] as const) {
    if (typeof body[key] !== 'string' || !(body[key] as string).trim()) return json({ error: `${key} is required.` }, 400);
  }
  const clean: Record<string, string | boolean> = {};
  for (const key of fields) {
    const value = body[key];
    if (value !== undefined && value !== null) {
      if (typeof value !== 'string') return json({ error: `Invalid ${key}.` }, 400);
      clean[key] = value.trim();
    }
  }
  if (body.is_default !== undefined && typeof body.is_default !== 'boolean') return json({ error: 'Invalid is_default.' }, 400);
  clean.is_default = body.is_default === true;
  if (clean.is_default) await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', user.id);
  const { data, error } = await supabase.from('customer_addresses').insert({ ...clean, user_id: user.id }).select('*').single();
  if (error) return json({ error: 'Could not save address. Check the details and try again.' }, 400);
  return json({ address: data }, 201);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Authentication required.' }, 401);
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return json({ error: 'Address id is required.' }, 400);
  const { error } = await supabase.from('customer_addresses').delete().eq('id', id).eq('user_id', user.id);
  if (error) return json({ error: 'Could not delete address.' }, 400);
  return json({ success: true });
}
