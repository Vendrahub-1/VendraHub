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

type Result = { products:{nodes:Array<{id:string;title:string;variants:{nodes:Array<{id:string;title:string;sku:string|null;inventoryQuantity:number|null;inventoryItem:{tracked:boolean}}>} }> } };
const QUERY = `query AdminInventory { products(first:50,sortKey:UPDATED_AT,reverse:true) { nodes { id title variants(first:20) { nodes { id title sku inventoryQuantity inventoryItem { tracked } } } } } }`;
export async function GET() {
 const auth=await ownerSession(); if ('response' in auth) return auth.response;
 try {
  const data=await shopifyAdminGraphql<Result>(QUERY);
  const items=data.products.nodes.flatMap(product=>product.variants.nodes.map(variant=>({productId:product.id,productTitle:product.title,variantId:variant.id,variantTitle:variant.title,sku:variant.sku,available:variant.inventoryQuantity,tracked:variant.inventoryItem.tracked})));
  return json({items});
 } catch(e) { console.error('Admin inventory lookup failed:',e instanceof Error?e.message:String(e)); return json({error:'Inventory is unavailable. Verify Shopify read_products and inventory read scopes.'},502); }
}
