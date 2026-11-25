const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? 'vendrahub-store.myshopify.com';
const SHOPIFY_API_VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-10';
const SHOPIFY_TOKEN_CANDIDATES = [
  { token: process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN, header: 'X-Shopify-Storefront-Access-Token' },
  { token: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN, header: 'Shopify-Storefront-Private-Token' },
  { token: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN_1, header: 'Shopify-Storefront-Private-Token' },
  { token: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN, header: 'X-Shopify-Storefront-Access-Token' },
  { token: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN_1, header: 'X-Shopify-Storefront-Access-Token' },
].filter((candidate): candidate is { token: string; header: string } => Boolean(candidate.token));

export type StorefrontProduct = {
  id: string;
  title: string;
  handle: string;
  description: string;
  availableForSale: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
  price: string;
  currencyCode: string;
  variantId: string | null;
};

type ShopifyProductsResponse = {
  data?: {
    products?: {
      nodes?: Array<{
        id: string;
        title: string;
        handle: string;
        description: string;
        availableForSale: boolean;
        featuredImage: { url: string; altText: string | null } | null;
        priceRange: {
          minVariantPrice: { amount: string; currencyCode: string };
        };
        variants: { nodes: Array<{ id: string }> };
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
};

const PRODUCTS_QUERY = `
  query VendraHubProducts($first: Int!, $query: String) {
    products(first: $first, query: $query, sortKey: RELEVANCE) {
      nodes {
        id
        title
        handle
        description
        availableForSale
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
        variants(first: 1) { nodes { id } }
      }
    }
  }
`;

export class ShopifyConfigurationError extends Error {
  constructor() {
    super('Shopify Storefront API is not configured.');
    this.name = 'ShopifyConfigurationError';
  }
}

export async function searchShopifyProducts(
  search = '',
  limit = 20,
): Promise<StorefrontProduct[]> {
  if (SHOPIFY_TOKEN_CANDIDATES.length === 0) throw new ShopifyConfigurationError();

  const boundedLimit = Math.min(Math.max(Math.floor(limit), 1), 20);
  const endpoint = `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
  let lastAuthStatus: number | null = null;

  for (const candidate of SHOPIFY_TOKEN_CANDIDATES) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [candidate.header]: candidate.token,
      },
      body: JSON.stringify({
        query: PRODUCTS_QUERY,
        variables: {
          first: boundedLimit,
          query: search.trim() ? search.trim().slice(0, 100).replace(/[\\\\:()]/g, '\\\\query: search.trim() ? `title:*${search.trim().slice(0, 100)}*` : null,') : null,
        },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 401 || response.status === 403) {
      lastAuthStatus = response.status;
      continue;
    }

    if (!response.ok) throw new Error(`Shopify request failed (${response.status}).`);

    const payload = (await response.json()) as ShopifyProductsResponse;
    if (payload.errors?.length) {
      const accessDenied = payload.errors.some((item) => /access denied|unauthorized|forbidden/i.test(item.message ?? ''));
      if (accessDenied) {
        lastAuthStatus = 403;
        continue;
      }
      throw new Error('Shopify returned a GraphQL error.');
    }

    if (!payload.data?.products) {
      throw new Error('Shopify returned an incomplete product response.');
    }

    return payload.data.products.nodes.map((product) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.description,
      availableForSale: product.availableForSale,
      imageUrl: product.featuredImage?.url ?? null,
      imageAlt: product.featuredImage?.altText ?? null,
      price: product.priceRange.minVariantPrice.amount,
      currencyCode: product.priceRange.minVariantPrice.currencyCode,
      variantId: product.variants.nodes[0]?.id ?? null,
    }));
  }

  const adminApiOrigin = process.env.VENDRAHUB_ADMIN_API_URL ?? 'https://vendrahub.vendrahub.workers.dev';
  const adminCatalogUrl = new URL('/api/public/products', adminApiOrigin);
  adminCatalogUrl.searchParams.set('limit', String(boundedLimit));
  if (search.trim()) adminCatalogUrl.searchParams.set('q', search.trim().slice(0, 100));

  const adminResponse = await fetch(adminCatalogUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });

  if (!adminResponse.ok) {
    throw new Error(`Shopify Storefront API rejected all configured tokens (${lastAuthStatus ?? 'unknown'}) and Admin catalog fallback failed (${adminResponse.status}).`);
  }

  const adminPayload = (await adminResponse.json()) as { products?: StorefrontProduct[] };
  return adminPayload.products ?? [];
}
