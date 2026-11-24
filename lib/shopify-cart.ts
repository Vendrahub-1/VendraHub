const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? 'vendrahub-store.myshopify.com';
const API_VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-10';
const TOKEN_CANDIDATES = [
  { token: process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN, header: 'X-Shopify-Storefront-Access-Token' },
  { token: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN, header: 'Shopify-Storefront-Private-Token' },
  { token: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN_1, header: 'Shopify-Storefront-Private-Token' },
  { token: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN, header: 'X-Shopify-Storefront-Access-Token' },
  { token: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN_1, header: 'X-Shopify-Storefront-Access-Token' },
].filter((candidate): candidate is { token: string; header: string } => Boolean(candidate.token));

type CartLine = { merchandiseId: string; quantity: number };

const CART_CREATE = `
  mutation VendraHubCartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

export async function createShopifyCheckout(lines: CartLine[]) {
  if (TOKEN_CANDIDATES.length === 0) throw new Error('Shopify Storefront API is not configured.');
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 50) {
    throw new Error('A cart must contain between 1 and 50 lines.');
  }
  const normalized = lines.map((line) => {
    if (!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(line.merchandiseId)) {
      throw new Error('Invalid Shopify product variant identifier.');
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) {
      throw new Error('Quantity must be an integer between 1 and 20.');
    }
    return { merchandiseId: line.merchandiseId, quantity: line.quantity };
  });

  let lastAuthStatus: number | null = null;
  for (const candidate of TOKEN_CANDIDATES) {
    const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [candidate.header]: candidate.token,
      },
      body: JSON.stringify({ query: CART_CREATE, variables: { input: { lines: normalized } } }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 401 || response.status === 403) {
      lastAuthStatus = response.status;
      continue;
    }
    if (!response.ok) throw new Error(`Shopify checkout service is unavailable (${response.status}).`);

    const payload = await response.json() as {
      data?: { cartCreate?: { cart?: { id: string; checkoutUrl: string }; userErrors?: Array<{ message: string }> } };
      errors?: Array<{ message?: string }>;
    };
    if (payload.errors?.length) {
      const accessDenied = payload.errors.some((item) => /access denied|unauthorized|forbidden/i.test(item.message ?? ''));
      if (accessDenied) {
        lastAuthStatus = 403;
        continue;
      }
      throw new Error('Shopify could not create the checkout cart.');
    }

    const result = payload.data?.cartCreate;
    if (result?.userErrors?.length) throw new Error(result.userErrors.map(error => error.message).join('; '));
    if (!result?.cart?.checkoutUrl) throw new Error('Shopify did not return a checkout URL.');

    const checkout = new URL(result.cart.checkoutUrl);
    if (checkout.protocol !== 'https:' || !checkout.hostname.endsWith('.myshopify.com')) {
      throw new Error('Shopify returned an unexpected checkout destination.');
    }
    return { cartId: result.cart.id, checkoutUrl: checkout.toString() };
  }

  throw new Error(`Shopify rejected all configured Storefront API tokens (${lastAuthStatus ?? 'unknown'}).`);
}
