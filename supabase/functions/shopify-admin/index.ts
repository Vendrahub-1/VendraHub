import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function readClaims(req: Request): Record<string, unknown> | null {
  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : authorization.trim();
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload + "=".repeat((4 - payload.length % 4) % 4)));
  } catch {
    return null;
  }
}

function getServiceKey(): string | null {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    return typeof keys.default === "string" ? keys.default : null;
  } catch {
    return null;
  }
}

async function authorizeAdmin(req: Request): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  // verify_jwt=true makes Supabase validate the JWT signature before the request reaches this handler.
  const claims = readClaims(req);
  if (!claims) return { ok: false, status: 401, error: "unauthorized" };
  const email = String(claims.email ?? "").toLowerCase();
  const verified = claims.email_verified === true || claims.email_verified === "true";
  if (email !== "vendrahub@hotmail.com" || !verified || claims.aal !== "aal2") {
    return { ok: false, status: 403, error: "admin_aal2_required" };
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = getServiceKey();
  if (!url || !serviceKey) return { ok: false, status: 503, error: "admin_authorization_unavailable" };

  try {
    const target = new URL("/rest/v1/admin_allowlist", url);
    target.searchParams.set("select", "enabled");
    target.searchParams.set("email", "eq." + email);
    target.searchParams.set("limit", "1");
    const response = await fetch(target, {
      headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { ok: false, status: 503, error: "admin_allowlist_check_failed" };
    const rows = await response.json();
    if (!Array.isArray(rows) || rows[0]?.enabled !== true) {
      return { ok: false, status: 403, error: "admin_not_allowlisted" };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 503, error: "admin_allowlist_check_unavailable" };
  }
}

async function shopifyGraphQL(query: string, variables: Record<string, unknown> = {}) {
  let domain = Deno.env.get("SHOPIFY_STORE_DOMAIN")?.trim() ?? "";
  const token = Deno.env.get("SHOPIFY_ADMIN_ACCESS_TOKEN")?.trim();
  const version = Deno.env.get("SHOPIFY_ADMIN_API_VERSION")?.trim() || "2026-10";
  domain = domain.replace("https://", "").replace("http://", "");
  while (domain.endsWith("/")) domain = domain.slice(0, -1);
  if (!domain || !domain.endsWith(".myshopify.com") || domain.includes(" ") || !token) {
    return { ok: false as const, status: 503, error: "shopify_admin_configuration_missing" };
  }
  try {
    const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(15000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false as const,
        status: response.status === 401 || response.status === 403 ? 502 : 502,
        error: response.status === 401 || response.status === 403 ? "shopify_auth_or_scope_error" : "shopify_api_error",
        provider_status: response.status,
      };
    }
    if (Array.isArray(payload?.errors) && payload.errors.length) {
      return {
        ok: false as const,
        status: 502,
        error: "shopify_graphql_error",
        details: payload.errors.slice(0, 3).map((e: Record<string, unknown>) => String(e.message ?? "GraphQL error").slice(0, 180)),
      };
    }
    return { ok: true as const, data: payload?.data ?? {} };
  } catch {
    return { ok: false as const, status: 502, error: "shopify_unreachable" };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const authorization = await authorizeAdmin(req);
  if (!authorization.ok) return json({ ok: false, error: authorization.error }, authorization.status);

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? (req.method === "POST" ? "product_update" : "shop");

  if (req.method === "GET" && action === "shop") {
    const result = await shopifyGraphQL(`query VendraHubShop { shop { name myshopifyDomain currencyCode timezoneAbbreviation } }`);
    return result.ok ? json({ ok: true, action, shop: result.data.shop }) : json({ ok: false, ...result }, result.status);
  }

  if (req.method === "GET" && action === "products") {
    const first = Math.min(Math.max(Number(url.searchParams.get("first") ?? 25) || 25, 1), 50);
    const after = url.searchParams.get("after");
    const result = await shopifyGraphQL(
      `query VendraHubProducts($first: Int!, $after: String) {
        products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
          nodes { id title handle status vendor productType updatedAt totalInventory featuredImage { url altText } variants(first: 20) { nodes { id title sku price inventoryQuantity } } }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { first, after },
    );
    return result.ok ? json({ ok: true, action, products: result.data.products }) : json({ ok: false, ...result }, result.status);
  }

  if (req.method === "GET" && action === "orders") {
    const first = Math.min(Math.max(Number(url.searchParams.get("first") ?? 25) || 25, 1), 50);
    const after = url.searchParams.get("after");
    const result = await shopifyGraphQL(
      `query VendraHubOrders($first: Int!, $after: String) {
        orders(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
          nodes {
            id name createdAt displayFinancialStatus displayFulfillmentStatus
            totalPriceSet { shopMoney { amount currencyCode } }
            customer { id displayName email }
            lineItems(first: 20) { nodes { title quantity sku originalUnitPriceSet { shopMoney { amount currencyCode } } } }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { first, after },
    );
    return result.ok ? json({ ok: true, action, orders: result.data.orders }) : json({ ok: false, ...result }, result.status);
  }

  if (req.method !== "POST") return json({ ok: false, error: "unsupported_action" }, 400);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  if (action === "product_create_draft") {
    if (body.confirm !== true) return json({ ok: false, error: "explicit_confirmation_required" }, 400);
    const title = String(body.title ?? "").trim();
    if (title.length < 2 || title.length > 255) return json({ ok: false, error: "invalid_title" }, 400);
    const product = {
      title,
      descriptionHtml: String(body.descriptionHtml ?? "").slice(0, 20000),
      vendor: String(body.vendor ?? "VendraHub").slice(0, 120),
      productType: String(body.productType ?? "").slice(0, 120),
      status: "DRAFT",
    };
    const result = await shopifyGraphQL(
      `mutation VendraHubCreateDraft($product: ProductCreateInput!) {
        productCreate(product: $product) { product { id title status } userErrors { field message } }
      }`,
      { product },
    );
    if (!result.ok) return json({ ok: false, ...result }, result.status);
    const payload = result.data.productCreate;
    if (payload?.userErrors?.length) return json({ ok: false, error: "shopify_user_errors", details: payload.userErrors }, 422);
    return json({ ok: true, action, product: payload?.product ?? null });
  }

  if (action === "product_update") {
    if (body.confirm !== true) return json({ ok: false, error: "explicit_confirmation_required" }, 400);
    const id = String(body.id ?? "");
    if (!id.startsWith("gid://shopify/Product/")) return json({ ok: false, error: "invalid_product_id" }, 400);
    const product: Record<string, unknown> = { id };
    for (const key of ["title", "descriptionHtml", "vendor", "productType"] as const) {
      if (typeof body[key] === "string") product[key] = String(body[key]).slice(0, key === "descriptionHtml" ? 20000 : 255);
    }
    if (Object.keys(product).length === 1) return json({ ok: false, error: "no_update_fields" }, 400);
    const result = await shopifyGraphQL(
      `mutation VendraHubUpdateProduct($product: ProductUpdateInput!) {
        productUpdate(product: $product) { product { id title status updatedAt } userErrors { field message } }
      }`,
      { product },
    );
    if (!result.ok) return json({ ok: false, ...result }, result.status);
    const payload = result.data.productUpdate;
    if (payload?.userErrors?.length) return json({ ok: false, error: "shopify_user_errors", details: payload.userErrors }, 422);
    return json({ ok: true, action, product: payload?.product ?? null });
  }

  if (action === "variants_update") {
    if (body.confirm !== true) return json({ ok: false, error: "explicit_confirmation_required" }, 400);
    const productId = String(body.productId ?? "");
    const variants = Array.isArray(body.variants) ? body.variants : [];
    if (!productId.startsWith("gid://shopify/Product/") || variants.length < 1 || variants.length > 20) {
      return json({ ok: false, error: "invalid_variant_update" }, 400);
    }
    const clean = variants.map((v: Record<string, unknown>) => {
      const item: Record<string, unknown> = { id: String(v.id ?? "") };
      if (typeof v.price === "string" && /^\d+(\.\d{1,2})?$/.test(v.price)) item.price = v.price;
      if (typeof v.sku === "string") item.sku = v.sku.slice(0, 100);
      return item;
    });
    if (clean.some((v: Record<string, unknown>) => !String(v.id).startsWith("gid://shopify/ProductVariant/") || Object.keys(v).length < 2)) {
      return json({ ok: false, error: "invalid_variant_fields" }, 400);
    }
    const result = await shopifyGraphQL(
      `mutation VendraHubUpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants { id price sku }
          userErrors { field message }
        }
      }`,
      { productId, variants: clean },
    );
    if (!result.ok) return json({ ok: false, ...result }, result.status);
    const payload = result.data.productVariantsBulkUpdate;
    if (payload?.userErrors?.length) return json({ ok: false, error: "shopify_user_errors", details: payload.userErrors }, 422);
    return json({ ok: true, action, variants: payload?.productVariants ?? [] });
  }

  return json({ ok: false, error: "unsupported_action" }, 400);
});