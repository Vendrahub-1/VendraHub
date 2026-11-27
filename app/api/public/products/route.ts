import { NextRequest, NextResponse } from "next/server";
import { shopifyAdminGraphql } from "@/lib/shopify-admin";
export const dynamic = "force-dynamic";
type AdminProductsResponse = { products: { nodes: Array<{
  id: string; title: string; handle: string; description: string; publishedAt: string | null;
  featuredMedia: { preview: { image: { url: string; altText: string | null } | null } | null } | null;
  priceRangeV2: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: { nodes: Array<{ id: string; title: string; availableForSale: boolean; price: string; selectedOptions: Array<{ name: string; value: string }> }> };
}> } };
const PUBLIC_PRODUCTS_QUERY = `
 query VendraHubPublishedProducts($first: Int!, $query: String!) {
  products(first: $first, query: $query, sortKey: RELEVANCE) {
   nodes { id title handle description publishedAt
    featuredMedia { ... on MediaImage { preview { image { url altText } } } }
    priceRangeV2 { minVariantPrice { amount currencyCode } }
    variants(first: 20) { nodes { id title availableForSale price selectedOptions { name value } } }
   }
  }
 }`;
export async function GET(request: NextRequest) {
 const hasAdminAccessToken = Boolean(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim());
 const hasClientCredentials = Boolean(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET);
 if (!hasAdminAccessToken && !hasClientCredentials) return NextResponse.json({ error: "Not found." }, { status: 404 });
 const url = new URL(request.url);
 const requestedLimit = Number(url.searchParams.get("limit") ?? 20);
 const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 20, 1), 20);
 const search = (url.searchParams.get("q") ?? "").slice(0, 100).replace(/[^\p{L}\p{N}\s-]/gu, " ").trim();
 const query = ["status:active", search ? `title:*${search}*` : null].filter(Boolean).join(" ");
 try {
  const data = await shopifyAdminGraphql<AdminProductsResponse>(PUBLIC_PRODUCTS_QUERY, { first: limit, query });
  const products = data.products.nodes.filter(product => Boolean(product.publishedAt)).map(product => {
   const variants = product.variants.nodes.map(variant => ({ id: variant.id, title: variant.title, availableForSale: variant.availableForSale, price: variant.price, currencyCode: product.priceRangeV2.minVariantPrice.currencyCode, selectedOptions: variant.selectedOptions }));
   const variant = variants.find(item => item.availableForSale) ?? variants[0];
   return { id: product.id, title: product.title, handle: product.handle, description: product.description,
    availableForSale: variants.some(item => item.availableForSale), imageUrl: product.featuredMedia?.preview?.image?.url ?? null,
    imageAlt: product.featuredMedia?.preview?.image?.altText ?? null, price: variant?.price ?? product.priceRangeV2.minVariantPrice.amount,
    currencyCode: variant?.currencyCode ?? product.priceRangeV2.minVariantPrice.currencyCode, variantId: variant?.id ?? null, variants };
  });
  return NextResponse.json({ products }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
 } catch (error) {
  console.error("Public Shopify catalog request failed:", error instanceof Error ? error.message : String(error));
  return NextResponse.json({ error: "Could not load products from Shopify." }, { status: 502 });
 }
}