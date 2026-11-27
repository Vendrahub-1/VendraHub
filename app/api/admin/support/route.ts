import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { shopifyAdminGraphql } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
async function ownerSession() {
 const supabase = await createClient();
 const { data: { user }, error } = await supabase.auth.getUser();
 if (error || !user || user.email?.toLowerCase() !== 'vendrahub@hotmail.com') return { response: json({ error: 'Owner access only.' }, 403) };
 const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
 if (assurance?.currentLevel !== 'aal2') return { response: json({ error: 'Authenticator verification required.' }, 403) };
 const [{ data: profile }, { data: roles }] = await Promise.all([
  supabase.from('admin_profiles').select('staff_status').eq('user_id', user.id).maybeSingle(),
  supabase.from('admin_role_assignments').select('role_code').eq('user_id', user.id),
 ]);
 if (profile?.staff_status !== 'active' || !roles?.some(role => role.role_code === 'super_admin')) return { response: json({ error: 'Active super-admin access is required.' }, 403) };
 return { supabase, user };
}

export async function GET() {
 const auth=await ownerSession(); if ('response' in auth) return auth.response;
 const {data,error}=await auth.supabase.from('support_tickets').select('id,user_id,subject,message,status,created_at,updated_at').order('created_at',{ascending:false}).limit(100);
 if(error) return json({error:'Could not load support tickets under the current owner session.'},500);
 return json({tickets:data});
}
export async function PATCH(request:NextRequest) {
 const auth=await ownerSession(); if ('response' in auth) return auth.response;
 let body:unknown; try{body=await request.json();}catch{return json({error:'A valid JSON body is required.'},400);}
 if(!body||typeof body!=='object') return json({error:'Invalid request.'},400);
 const {id,status}=body as {id?:unknown;status?:unknown};
 const allowed=['open','in_progress','waiting_on_customer','resolved','closed'];
 if(typeof id!=='string'||!/^[0-9a-f-]{36}$/i.test(id)||typeof status!=='string'||!allowed.includes(status)) return json({error:'A valid ticket and support status are required.'},400);
 const {data,error}=await auth.supabase.from('support_tickets').update({status,updated_at:new Date().toISOString()}).eq('id',id).select('id,status').single();
 if(error||!data) return json({error:'Support status could not be updated.'},500);
 const audit=await auth.supabase.from('audit_events').insert({actor_id:auth.user.id,action:'support_ticket.status_changed',resource_type:'support_ticket',resource_id:id,outcome:'success',details:{status}});
 if(audit.error) console.error('Support audit event could not be recorded:',audit.error.message);
 return json({ticket:data,message:'Ticket status updated.'});
}
