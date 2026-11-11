const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? 'vendrahub-store.myshopify.com';
const SHOPIFY_API_VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-10';
const SHOPIFY_PRIVATE_TOKEN = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;

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
  if (!SHOPIFY_PRIVATE_TOKEN) throw new ShopifyConfigurationError();

  const boundedLimit = Math.min(Math.max(Math.floor(limit), 1), 20);
  const endpoint = `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Shopify-Storefront-Private-Token': SHOPIFY_PRIVATE_TOKEN,
    },
    body: JSON.stringify({
      query: PRODUCTS_QUERY,
      variables: {
        first: boundedLimit,
        query: search.trim() ? `title:*${search.trim().slice(0, 100)}*` : null,
      },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) throw new Error(`Shopify request failed (${response.status}).`);

  const payload = (await response.json()) as ShopifyProductsResponse;
  if (payload.errors?.length) throw new Error('Shopify returned a GraphQL error.');

  return (payload.data?.products?.nodes ?? []).map((product) => ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: product.description,
    availableForSale: product.availableForSale,
    imageUrl: product.featuredImage?.url ?? null,
    imageAlt: product.featuredImage?.altText ?? null,
    price: product.priceRange.minVariantPrice.amount,
    currencyCode: product.priceRange.minVariantPrice.currencyCode,
  }));
}
