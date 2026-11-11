import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || typeof (body as { full_name?: unknown }).full_name !== 'string') return NextResponse.json({ error: 'A valid full name is required.' }, { status: 400 });
  const full_name = (body as { full_name: string }).full_name.trim();
  if (full_name.length < 2 || full_name.length > 120) return NextResponse.json({ error: 'Name must be 2–120 characters.' }, { status: 400 });
  const { data, error } = await supabase.from('profiles').upsert({ id: user.id, full_name }, { onConflict: 'id' }).select('id,full_name,avatar_url,updated_at').single();
  if (error) return NextResponse.json({ error: 'Could not update profile.' }, { status: 400 });
  return NextResponse.json({ profile: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}
