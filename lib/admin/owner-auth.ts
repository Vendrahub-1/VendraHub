import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const jsonResponse = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });

export async function requireAdminOwner() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || user.email?.toLowerCase() !== 'vendrahub@hotmail.com') {
    return { response: jsonResponse({ error: 'Owner access only.' }, 403) } as const;
  }

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== 'aal2') {
    return { response: jsonResponse({ error: 'Authenticator verification required.' }, 403) } as const;
  }

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from('admin_profiles').select('staff_status').eq('user_id', user.id).maybeSingle(),
    supabase.from('admin_role_assignments').select('role_code').eq('user_id', user.id),
  ]);

  if (profile?.staff_status !== 'active' || !roles?.some((role) => role.role_code === 'super_admin')) {
    return { response: jsonResponse({ error: 'Active super-admin access is required.' }, 403) } as const;
  }

  return { supabase, user } as const;
}
