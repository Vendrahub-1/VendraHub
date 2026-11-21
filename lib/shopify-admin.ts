type ShopifyTokenResponse = {
  access_token?: string;
  expires_in?: number;
  scope?: string;
};

type ShopifyGraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

function getShopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim().toLowerCase();
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!domain || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain)) {
    throw new Error("Shopify store domain is missing or invalid.");
  }
  if (!clientId || !clientSecret) {
    throw new Error("Shopify Admin API client credentials are not configured.");
  }

  return { domain, clientId, clientSecret };
}

export async function getShopifyAdminAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const { domain, clientId, clientSecret } = getShopifyConfig();
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Shopify Admin token exchange failed (${response.status}).`);
  }

  const payload = (await response.json()) as ShopifyTokenResponse;
  if (!payload.access_token) {
    throw new Error("Shopify did not return an Admin API access token.");
  }

  const lifetime = Math.max(60, Number(payload.expires_in ?? 86_399));
  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + lifetime * 1000,
  };

  return cachedToken.value;
}

export async function shopifyAdminGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { domain } = getShopifyConfig();
  const token = await getShopifyAdminAccessToken();
  const version = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-10";

  const response = await fetch(
    `https://${domain}/admin/api/${version}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Shopify Admin GraphQL request failed (${response.status}).`);
  }

  const payload = (await response.json()) as ShopifyGraphqlResponse<T>;
  if (payload.errors?.length || !payload.data) {
    throw new Error("Shopify Admin GraphQL returned an error.");
  }

  return payload.data;
}
