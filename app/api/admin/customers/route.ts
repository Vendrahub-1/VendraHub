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

type Result = { customers:{nodes:Array<{id:string;displayName:string;firstName:string|null;lastName:string|null;email:string|null;phone:string|null;numberOfOrders:number;amountSpent:{amount:string;currencyCode:string};createdAt:string}>} };
const QUERY = `query AdminCustomers { customers(first:50,sortKey:CREATED_AT,reverse:true) { nodes { id displayName firstName lastName email phone numberOfOrders amountSpent { amount currencyCode } createdAt } } }`;
export async function GET() {
 const auth=await ownerSession(); if ('response' in auth) return auth.response;
 try { const data=await shopifyAdminGraphql<Result>(QUERY); return json({customers:data.customers.nodes}); }
 catch(e) { console.error('Admin customers lookup failed:',e instanceof Error?e.message:String(e)); return json({error:'Customers are unavailable. Verify Shopify read_customers permission and protected customer-data access.'},502); }
}
