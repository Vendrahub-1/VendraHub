import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

async function authorize(req: Request): Promise<{ ok: true; serviceKey: string; supabaseUrl: string } | { ok: false; status: number; error: string }> {
  // Supabase's verify_jwt gateway validates the JWT signature before this handler executes.
  const claims = readClaims(req);
  if (!claims) return { ok: false, status: 401, error: "unauthorized" };
  const email = String(claims.email ?? "").toLowerCase();
  const verified = claims.email_verified === true || claims.email_verified === "true";
  if (email !== "vendrahub@hotmail.com" || !verified || claims.aal !== "aal2") {
    return { ok: false, status: 403, error: "admin_aal2_required" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = getServiceKey();
  if (!supabaseUrl || !serviceKey) return { ok: false, status: 503, error: "admin_authorization_unavailable" };

  try {
    const target = new URL("/rest/v1/admin_allowlist", supabaseUrl);
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
    return { ok: true, serviceKey, supabaseUrl };
  } catch {
    return { ok: false, status: 503, error: "admin_allowlist_check_unavailable" };
  }
}

async function updateConnection(
  auth: { serviceKey: string; supabaseUrl: string },
  supplier: string,
  metadata: Record<string, unknown>,
) {
  const target = new URL("/rest/v1/supplier_connections", auth.supabaseUrl);
  target.searchParams.set("supplier_code", "eq." + supplier);
  target.searchParams.set("select", "metadata");
  const currentResponse = await fetch(target, {
    headers: { apikey: auth.serviceKey, Authorization: "Bearer " + auth.serviceKey },
    signal: AbortSignal.timeout(8000),
  });
  if (!currentResponse.ok) throw new Error("connection_state_read_failed");
  const currentRows = await currentResponse.json();
  const currentMetadata = Array.isArray(currentRows) && currentRows[0]?.metadata && typeof currentRows[0].metadata === "object"
    ? currentRows[0].metadata
    : {};
  const response = await fetch(target, {
    method: "PATCH",
    headers: {
      apikey: auth.serviceKey,
      Authorization: "Bearer " + auth.serviceKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      connection_status: "connected",
      integration_method: "direct_api",
      last_checked_at: new Date().toISOString(),
      metadata: { ...currentMetadata, ...metadata },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("connection_state_update_failed");
}

async function cjAccessToken() {
  const apiKey = Deno.env.get("CJ_API_KEY")?.trim();
  if (!apiKey) throw new Error("missing_cj_api_key");
  const response = await fetch("https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
    signal: AbortSignal.timeout(12000),
  });
  const payload = await response.json().catch(() => ({}));
  const token = payload?.data?.accessToken;
  if (!response.ok || payload?.code !== 200 || payload?.success !== true || typeof token !== "string") {
    throw new Error("cj_authentication_rejected");
  }
  return { token, openIdPresent: Boolean(payload?.data?.openId) };
}

async function cjCatalogue(query: string, page: number) {
  const auth = await cjAccessToken();
  const url = new URL("https://developers.cjdropshipping.com/api2.0/v1/product/listV2");
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", "20");
  if (query) url.searchParams.set("keyWord", query);
  const response = await fetch(url, {
    headers: { "CJ-Access-Token": auth.token, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.code !== 200 || payload?.result !== true || payload?.success !== true) {
    throw new Error("cj_catalogue_request_failed");
  }
  const groups = Array.isArray(payload?.data?.content) ? payload.data.content : [];
  const raw = groups.flatMap((group: Record<string, unknown>) =>
    Array.isArray(group.productList) ? group.productList : []
  );
  return {
    products: raw.map((p: Record<string, unknown>) => ({
      supplier: "cjdropshipping",
      id: String(p.id ?? ""),
      title: String(p.nameEn ?? "CJ product"),
      image: typeof p.bigImage === "string" ? p.bigImage : null,
      sku: typeof p.sku === "string" ? p.sku : null,
      cost: p.nowPrice ?? p.sellPrice ?? null,
      currency: "USD",
      category: p.threeCategoryName ?? p.twoCategoryName ?? null,
      inventory: p.totalVerifiedInventory ?? p.warehouseInventoryNum ?? null,
      free_shipping: p.addMarkStatus === 1,
      delivery_cycle_days: p.deliveryCycle ?? null,
      source: "CJdropshipping catalogue",
    })),
    page,
    page_size: 20,
    total_records: payload?.data?.totalRecords ?? null,
    open_id_present: auth.openIdPresent,
  };
}

async function printfulCatalogue(query: string) {
  const token = Deno.env.get("PRINTFUL_API_TOKEN")?.trim();
  if (!token) throw new Error("missing_printful_token");
  const response = await fetch("https://api.printful.com/products", {
    headers: { Authorization: "Bearer " + token, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) throw new Error("printful_token_rejected");
  if (!response.ok || payload?.code !== 200 || !Array.isArray(payload?.result)) {
    throw new Error("printful_catalogue_request_failed");
  }
  const q = query.toLowerCase();
  const all = payload.result.map((p: Record<string, unknown>) => ({
    supplier: "printful",
    id: String(p.id ?? ""),
    title: String(p.title ?? "Printful product"),
    image: typeof p.image === "string" ? p.image : null,
    sku: null,
    cost: null,
    currency: typeof p.currency === "string" ? p.currency : null,
    category: p.type_name ?? p.type ?? null,
    variant_count: p.variant_count ?? null,
    source: "Printful catalogue",
  }));
  const products = q ? all.filter((p: Record<string, unknown>) =>
    String(p.title).toLowerCase().includes(q) || String(p.category ?? "").toLowerCase().includes(q)
  ) : all;
  return { products: products.slice(0, 50), total_matches: products.length, catalogue_total: all.length };
}


async function shopifyCatalogue(query: string) {
  let domain = Deno.env.get("SHOPIFY_STORE_DOMAIN")?.trim() ?? "";
  const token = Deno.env.get("SHOPIFY_ADMIN_ACCESS_TOKEN")?.trim();
  const version = Deno.env.get("SHOPIFY_ADMIN_API_VERSION")?.trim() || "2026-10";
  domain = domain.replace("https://", "").replace("http://", "");
  while (domain.endsWith("/")) domain = domain.slice(0, -1);
  if (!domain || !domain.endsWith(".myshopify.com") || domain.includes(" ") || !token) {
    throw new Error("shopify_admin_configuration_missing");
  }
  const safeQuery = query.replace(/[^a-zA-Z0-9 _-]/g, " ").trim().slice(0, 100);
  const search = safeQuery ? "title:" + safeQuery : null;
  const response = await fetch("https://" + domain + "/admin/api/" + version + "/graphql.json", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({
      query: `query SupplierHubStoreProducts($first: Int!, $search: String) {
        products(first: $first, query: $search, sortKey: UPDATED_AT, reverse: true) {
          nodes { id title vendor productType status featuredImage { url altText } }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      variables: { first: 25, search },
    }),
    signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.errors?.length || !payload?.data?.products) {
    throw new Error(response.status === 401 || response.status === 403 ? "shopify_auth_or_read_products_scope_error" : "shopify_catalogue_request_failed");
  }
  return {
    products: (payload.data.products.nodes ?? []).map((p: Record<string, unknown>) => ({
      supplier: "shopify",
      id: String(p.id ?? ""),
      title: String(p.title ?? "Shopify product"),
      image: typeof (p.featuredImage as Record<string, unknown> | null)?.url === "string" ? (p.featuredImage as Record<string, unknown>).url : null,
      sku: null,
      cost: null,
      currency: null,
      category: p.productType ?? p.vendor ?? null,
      status: p.status ?? null,
      source: "Shopify store catalogue; may include products imported by Syncee or DSers",
    })),
    page_info: payload.data.products.pageInfo,
    source_note: "Shopify products are visible here after a supplier app imports them. Supplier origin is not inferred unless the product metadata identifies it.",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);

  const authorization = await authorize(req);
  if (!authorization.ok) return json({ ok: false, error: authorization.error }, authorization.status);

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "status";
  const supplier = url.searchParams.get("supplier") ?? "";
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
  const page = Math.min(Math.max(Number(url.searchParams.get("page") ?? "1") || 1, 1), 1000);

  if (action === "status") {
    const target = new URL("/rest/v1/supplier_connections", authorization.supabaseUrl);
    target.searchParams.set("select", "supplier_code,connection_status,integration_method,last_checked_at,metadata");
    target.searchParams.set("order", "supplier_code.asc");
    const response = await fetch(target, {
      headers: { apikey: authorization.serviceKey, Authorization: "Bearer " + authorization.serviceKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return json({ ok: false, error: "supplier_status_unavailable" }, 503);
    const rows = await response.json();
    return json({
      ok: true,
      suppliers: Array.isArray(rows) ? rows.map((row: Record<string, unknown>) => ({
        supplier_code: row.supplier_code,
        connection_status: row.connection_status,
        integration_method: row.integration_method,
        last_checked_at: row.last_checked_at,
        metadata: row.metadata,
      })) : [],
      credentials_exposed: false,
    });
  }

  if (action === "shopify-catalogue") {
    try {
      const catalogue = await shopifyCatalogue(query);
      return json({ ok: true, supplier: "shopify", query, ...catalogue, import_enabled: false, publish_enabled: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "shopify_catalogue_unavailable";
      return json({ ok: false, supplier: "shopify", error: message }, message.includes("configuration_missing") ? 503 : 502);
    }
  }

  if (supplier !== "cjdropshipping" && supplier !== "printful") {
    return json({ ok: false, error: "direct_catalogue_not_available", message: "This supplier uses its official Shopify app workflow. Complete installation in Shopify, then inspect the products imported into the store." }, 400);
  }

  if (action === "connect") {
    try {
      if (supplier === "cjdropshipping") {
        const result = await cjAccessToken();
        await updateConnection(authorization, supplier, {
          authentication: "verified",
          catalogue_access: "available",
          open_id_present: result.openIdPresent,
          credentials_exposed: false,
          verified_at: new Date().toISOString(),
        });
      } else {
        const token = Deno.env.get("PRINTFUL_API_TOKEN")?.trim();
        if (!token) throw new Error("missing_printful_token");
        const response = await fetch("https://api.printful.com/products", {
          headers: { Authorization: "Bearer " + token, Accept: "application/json" },
          signal: AbortSignal.timeout(15000),
        });
        if (response.status === 401) throw new Error("printful_token_rejected");
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.code !== 200 || !Array.isArray(payload?.result)) throw new Error("printful_authentication_failed");
        await updateConnection(authorization, supplier, {
          authentication: "verified",
          catalogue_access: "available",
          catalogue_count: payload.result.length,
          credentials_exposed: false,
          verified_at: new Date().toISOString(),
        });
      }
      return json({ ok: true, supplier, connected: true, authentication: "verified", catalogue_access: "available", credentials_exposed: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "supplier_verification_failed";
      return json({ ok: false, supplier, connected: false, error: message }, message.startsWith("missing_") ? 503 : 502);
    }
  }

  if (action === "catalogue") {
    try {
      const catalogue = supplier === "cjdropshipping"
        ? await cjCatalogue(query, page)
        : await printfulCatalogue(query);
      return json({ ok: true, supplier, query, ...catalogue, import_enabled: false, publish_enabled: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "catalogue_unavailable";
      return json({ ok: false, supplier, error: message }, message.startsWith("missing_") ? 503 : 502);
    }
  }

  return json({ ok: false, error: "unsupported_action" }, 400);
});
