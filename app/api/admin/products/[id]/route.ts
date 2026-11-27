import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { shopifyAdminGraphql } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';
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
type ProductInput = { title?: string; description?: string; vendor?: string; productType?: string; tags?: string[]; price?: string | number; sku?: string; imageUrl?: string };
type ShopifyProduct = { id: string; title: string; status: string; variants: { nodes: Array<{ id: string }> } };
const UPDATE_PRODUCT = `
 mutation VendraHubUpdateProduct($product: ProductUpdateInput!) {
  productUpdate(product: $product) {
   product { id title status variants(first: 1) { nodes { id } } }
   userErrors { field message }
  }
 }`;
const UPDATE_VARIANT = `
 mutation VendraHubUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
   userErrors { field message }
  }
 }`;
const ADD_MEDIA = `
 mutation VendraHubAddProductImage($product: ProductUpdateInput!, $media: [CreateMediaInput!]!) {
  productUpdate(product: $product, media: $media) {
   product { id }
   userErrors { field message }
  }
 }`;
const PUBLISH_QUERY = `query VendraHubPublications { publications(first: 20) { nodes { id name } } }`;
const ACTIVATE_MUTATION = `
 mutation VendraHubActivateProduct($product: ProductUpdateInput!) {
  productUpdate(product: $product) { product { id status } userErrors { field message } }
 }`;
const PUBLISH_MUTATION = `
 mutation VendraHubPublishProduct($id: ID!, $input: [PublicationInput!]!) {
  publishablePublish(id: $id, input: $input) { userErrors { field message } }
 }`;
const UNPUBLISH_MUTATION = `
 mutation VendraHubUnpublishProduct($id: ID!, $input: [PublicationInput!]!) {
  publishableUnpublish(id: $id, input: $input) { userErrors { field message } }
 }`;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 const auth = await ownerSession(); if ('response' in auth) return auth.response;
 const { id } = await params;
 if (!/^gid:\/\/shopify\/Product\/\d+$/.test(id)) return json({ error: 'Invalid Shopify product ID.' }, 400);
 let input: ProductInput;
 try { input = await request.json(); } catch { return json({ error: 'A valid JSON body is required.' }, 400); }
 const title = typeof input.title === 'string' ? input.title.trim() : '';
 const description = typeof input.description === 'string' ? input.description.trim() : '';
 const vendor = typeof input.vendor === 'string' ? input.vendor.trim() : '';
 const productType = typeof input.productType === 'string' ? input.productType.trim() : '';
 const price = Number(input.price);
 const sku = typeof input.sku === 'string' ? input.sku.trim() : '';
 const imageUrl = typeof input.imageUrl === 'string' ? input.imageUrl.trim() : '';
 if (title.length < 2 || title.length > 255 || description.length > 10000 || !Number.isFinite(price) || price < 0 || price > 1000000000) return json({ error: 'Check the product title, description and price.' }, 400);
 if (imageUrl) { try { if (new URL(imageUrl).protocol !== 'https:') throw new Error(); } catch { return json({ error: 'Product image must be a valid HTTPS URL.' }, 400); } }
 try {
  const updated = await shopifyAdminGraphql<{ productUpdate: { product: ShopifyProduct | null; userErrors: Array<{ message: string }> } }>(UPDATE_PRODUCT, {
   product: { id, title, descriptionHtml: description, vendor, productType, tags: Array.isArray(input.tags) ? input.tags.filter(item => typeof item === 'string').slice(0, 20) : [] },
  });
  if (updated.productUpdate.userErrors.length || !updated.productUpdate.product) return json({ error: updated.productUpdate.userErrors.map(item => item.message).join(' ') || 'Product update failed.' }, 422);
  const variantId = updated.productUpdate.product.variants.nodes[0]?.id;
  if (variantId) {
   const variantUpdate = await shopifyAdminGraphql<{ productVariantsBulkUpdate: { userErrors: Array<{ message: string }> } }>(UPDATE_VARIANT, {
    productId: id, variants: [{ id: variantId, price: price.toFixed(2), inventoryItem: { sku: sku || null, tracked: true } }],
   });
   if (variantUpdate.productVariantsBulkUpdate.userErrors.length) return json({ product: updated.productUpdate.product, warning: variantUpdate.productVariantsBulkUpdate.userErrors.map(item => item.message).join(' ') }, 207);
  }
  if (imageUrl) {
   const media = await shopifyAdminGraphql<{ productUpdate: { userErrors: Array<{ message: string }> } }>(ADD_MEDIA, { product: { id }, media: [{ mediaContentType: 'IMAGE', originalSource: imageUrl, alt: title }] });
   if (media.productUpdate.userErrors.length) console.warn('Product saved but image could not be added:', media.productUpdate.userErrors);
  }
  await auth.supabase.from('audit_events').insert({ actor_id: auth.user.id, action: 'product.updated', resource_type: 'shopify_product', resource_id: id, outcome: 'success', details: { title } });
  return json({ product: updated.productUpdate.product, message: 'Product changes saved.' });
 } catch (error) {
  console.error('Shopify product update failed:', error instanceof Error ? error.message : String(error));
  return json({ error: 'Product could not be updated. Verify Shopify Admin API write permissions.' }, 502);
 }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 const auth = await ownerSession(); if ('response' in auth) return auth.response;
 const { id } = await params;
 if (!/^gid:\/\/shopify\/Product\/\d+$/.test(id)) return json({ error: 'Invalid Shopify product ID.' }, 400);
 let action: string;
 try { action = (await request.json()).action; } catch { return json({ error: 'A valid action is required.' }, 400); }
 if (action !== 'publish' && action !== 'unpublish') return json({ error: 'Unsupported product action.' }, 400);
 try {
  const publications = await shopifyAdminGraphql<{ publications: { nodes: Array<{ id: string; name: string }> } }>(PUBLISH_QUERY);
  const publication = publications.publications.nodes.find(item => /online store/i.test(item.name)) ?? publications.publications.nodes.find(item => /online/i.test(item.name));
  if (!publication) return json({ error: 'The Shopify Online Store sales channel publication was not found. Connect the Online Store channel first.' }, 409);
  if (action === 'publish') {
   const activated = await shopifyAdminGraphql<{ productUpdate: { userErrors: Array<{ message: string }> } }>(ACTIVATE_MUTATION, { product: { id, status: 'ACTIVE' } });
   if (activated.productUpdate.userErrors.length) return json({ error: activated.productUpdate.userErrors.map(item => item.message).join(' ') }, 422);
  }
  const mutation = action === 'publish' ? PUBLISH_MUTATION : UNPUBLISH_MUTATION;
  const key = action === 'publish' ? 'publishablePublish' : 'publishableUnpublish';
  const result = await shopifyAdminGraphql<Record<string, { userErrors: Array<{ message: string }> }>>(mutation, { id, input: [{ publicationId: publication.id }] });
  const errors = result[key]?.userErrors ?? [];
  if (errors.length) return json({ error: errors.map(item => item.message).join(' ') }, 422);
  await auth.supabase.from('audit_events').insert({ actor_id: auth.user.id, action: action === 'publish' ? 'product.published' : 'product.unpublished', resource_type: 'shopify_product', resource_id: id, outcome: 'success', details: { publication: publication.name } });
  return json({ success: true, message: action === 'publish' ? 'Product published to the Online Store channel.' : 'Product unpublished from the Online Store channel.' });
 } catch (error) {
  console.error('Shopify product publication failed:', error instanceof Error ? error.message : String(error));
  return json({ error: 'Shopify could not change the product publication. Verify product publish permissions.' }, 502);
 }
}
