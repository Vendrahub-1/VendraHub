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

type Result = { orders: { nodes: Array<{ id:string; name:string; createdAt:string; email:string|null; displayFinancialStatus:string; displayFulfillmentStatus:string; totalPriceSet:{shopMoney:{amount:string;currencyCode:string}}; customer:{displayName:string;email:string|null}|null; lineItems:{nodes:Array<{title:string;quantity:number}>} }> } };
const QUERY = `query AdminOrders { orders(first:50, sortKey:CREATED_AT, reverse:true) { nodes { id name createdAt email displayFinancialStatus displayFulfillmentStatus totalPriceSet { shopMoney { amount currencyCode } } customer { displayName email } lineItems(first:20) { nodes { title quantity } } } } }`;
export async function GET() {
 const auth = await ownerSession(); if ('response' in auth) return auth.response;
 try { const data=await shopifyAdminGraphql<Result>(QUERY); return json({orders:data.orders.nodes}); }
 catch(e) { console.error('Admin orders lookup failed:',e instanceof Error?e.message:String(e)); return json({error:'Orders are unavailable. Verify Shopify read_orders permission and protected customer-data access.'},502); }
}
