import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data, error } = await supabase.from('support_tickets')
    .select('id, subject, message, status, created_at, updated_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: 'Could not load support requests.' }, { status: 500 });
  return NextResponse.json({ tickets: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { subject, message } = body as { subject?: unknown; message?: unknown };
  if (typeof subject !== 'string' || subject.trim().length < 3 || subject.trim().length > 160 ||
      typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 5000) {
    return NextResponse.json({ error: 'Subject must be 3–160 characters and message 10–5000 characters.' }, { status: 400 });
  }
  const { data, error } = await supabase.from('support_tickets').insert({
    user_id: user.id, subject: subject.trim(), message: message.trim(),
  }).select('id, subject, status, created_at').single();
  if (error) return NextResponse.json({ error: 'Could not create support request.' }, { status: 500 });
  return NextResponse.json({ ticket: data }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}
