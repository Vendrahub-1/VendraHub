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

type ProductNode = {
  id: string; title: string; handle: string; descriptionHtml: string; vendor: string; productType: string;
  status: string; publishedAt: string | null; tags: string[];
  featuredImage: { url: string; altText: string | null } | null;
  variants: { nodes: Array<{ id: string; title: string; price: string; sku: string | null; inventoryQuantity: number | null; availableForSale: boolean }> };
};
type ProductList = { products: { nodes: ProductNode[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } };

const LIST_QUERY = `
 query VendraHubAdminProducts($first: Int!, $after: String, $query: String) {
  products(first: $first, after: $after, query: $query, sortKey: UPDATED_AT, reverse: true) {
   nodes { id title handle descriptionHtml vendor productType status publishedAt tags
    featuredImage { url altText }
    variants(first: 20) { nodes { id title price sku inventoryQuantity availableForSale } }
   }
   pageInfo { hasNextPage endCursor }
  }
 }`;

function validateProduct(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Product details are required.');
  const value = input as Record<string, unknown>;
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const description = typeof value.description === 'string' ? value.description.trim() : '';
  const vendor = typeof value.vendor === 'string' ? value.vendor.trim() : 'VendraHub';
  const productType = typeof value.productType === 'string' ? value.productType.trim() : '';
  const sku = typeof value.sku === 'string' ? value.sku.trim() : '';
  const price = typeof value.price === 'string' || typeof value.price === 'number' ? Number(value.price) : NaN;
  const imageUrl = typeof value.imageUrl === 'string' ? value.imageUrl.trim() : '';
  const tags = Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean).slice(0, 20) : [];
  if (title.length < 2 || title.length > 255) throw new Error('Product title must be between 2 and 255 characters.');
  if (description.length > 10000) throw new Error('Description is too long.');
  if (vendor.length > 255 || productType.length > 255 || sku.length > 100) throw new Error('Vendor, category or SKU is too long.');
  if (!Number.isFinite(price) || price < 0 || price > 1000000000) throw new Error('Enter a valid non-negative price.');
  if (imageUrl) { const url = new URL(imageUrl); if (url.protocol !== 'https:') throw new Error('Product image must use an HTTPS URL.'); }
  return { title, description, vendor, productType, sku, price: price.toFixed(2), imageUrl, tags };
}

async function recordAudit(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, action: string, productId: string, details: Record<string, unknown>) {
  const { error } = await supabase.from('audit_events').insert({ actor_id: userId, action, resource_type: 'shopify_product', resource_id: productId, outcome: 'success', details });
  if (error) console.error('Product audit event could not be recorded:', error.message);
}

export async function GET(request: NextRequest) {
  const auth = await ownerSession();
  if ('response' in auth) return auth.response;
  const search = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100);
  const status = request.nextUrl.searchParams.get('status') ?? 'ALL';
  const after = request.nextUrl.searchParams.get('after');
  const queryParts: string[] = [];
  if (status === 'ACTIVE' || status === 'DRAFT' || status === 'ARCHIVED') queryParts.push(`status:${status.toLowerCase()}`);
  if (search) queryParts.push(`title:*${search.replace(/[\\:"()]/g, ' ')}*`);
  try {
    const data = await shopifyAdminGraphql<ProductList>(LIST_QUERY, { first: 40, after: after || null, query: queryParts.join(' ') || null });
    return json({ products: data.products.nodes, pageInfo: data.products.pageInfo });
  } catch (error) {
    console.error('Admin Shopify product list failed:', error instanceof Error ? error.message : String(error));
    return json({ error: 'Could not load products from Shopify. Check the Shopify Admin API connection and product read scope.' }, 502);
  }
}

const CREATE_MUTATION = `
 mutation VendraHubCreateProduct($product: ProductCreateInput!) {
  productCreate(product: $product) {
   product { id title status variants(first: 1) { nodes { id } } }
   userErrors { field message }
  }
 }`;
const VARIANT_UPDATE = `
 mutation VendraHubUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
   product { id }
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

export async function POST(request: NextRequest) {
  const auth = await ownerSession();
  if ('response' in auth) return auth.response;
  let input: ReturnType<typeof validateProduct>;
  try { input = validateProduct(await request.json()); }
  catch (error) { return json({ error: error instanceof Error ? error.message : 'Invalid product details.' }, 400); }
  try {
    const created = await shopifyAdminGraphql<{ productCreate: { product: { id: string; title: string; status: string; variants: { nodes: Array<{ id: string }> } } | null; userErrors: Array<{ field: string[] | null; message: string }> } }>(CREATE_MUTATION, {
      product: { title: input.title, descriptionHtml: input.description, vendor: input.vendor, productType: input.productType, tags: input.tags, status: 'DRAFT' },
    });
    const result = created.productCreate;
    if (result.userErrors.length || !result.product) return json({ error: result.userErrors.map(item => item.message).join(' ') || 'Shopify did not create the product.' }, 422);
    const variantId = result.product.variants.nodes[0]?.id;
    if (variantId) {
      const updated = await shopifyAdminGraphql<{ productVariantsBulkUpdate: { userErrors: Array<{ message: string }> } }>(VARIANT_UPDATE, {
        productId: result.product.id,
        variants: [{ id: variantId, price: input.price, inventoryItem: { sku: input.sku || null, tracked: true } }],
      });
      if (updated.productVariantsBulkUpdate.userErrors.length) return json({ product: result.product, warning: updated.productVariantsBulkUpdate.userErrors.map(item => item.message).join(' '), created: true }, 207);
    }
    if (input.imageUrl) {
      const media = await shopifyAdminGraphql<{ productUpdate: { userErrors: Array<{ message: string }> } }>(ADD_MEDIA, {
        product: { id: result.product.id },
        media: [{ mediaContentType: 'IMAGE', originalSource: input.imageUrl, alt: input.title }],
      });
      if (media.productUpdate.userErrors.length) console.warn('Product created but image was not added:', media.productUpdate.userErrors);
    }
    await recordAudit(auth.supabase, auth.user.id, 'product.created_draft', result.product.id, { title: input.title });
    return json({ product: result.product, message: 'Product created as a draft. Review it and publish when ready.' }, 201);
  } catch (error) {
    console.error('Shopify product create failed:', error instanceof Error ? error.message : String(error));
    return json({ error: 'Product could not be created in Shopify. Verify Admin API product write permissions.' }, 502);
  }
}
