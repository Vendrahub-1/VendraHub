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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);

  // Supabase's verify_jwt gateway validates the token signature before this handler runs.
  const claims = readClaims(req);
  if (!claims) return json({ ok: false, error: "unauthorized" }, 401);

  const email = String(claims.email ?? "").toLowerCase();
  const verified = claims.email_verified === true || claims.email_verified === "true";
  if (email !== "vendrahub@hotmail.com" || !verified || claims.aal !== "aal2") {
    return json({ ok: false, error: "admin_aal2_required" }, 403);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = getServiceKey();
  if (!url || !serviceKey) {
    return json({ ok: false, error: "supabase_admin_environment_unavailable" }, 503);
  }

  try {
    const allowlistUrl = new URL("/rest/v1/admin_allowlist", url);
    allowlistUrl.searchParams.set("select", "enabled");
    allowlistUrl.searchParams.set("email", "eq." + email);
    allowlistUrl.searchParams.set("limit", "1");
    const allowlistResponse = await fetch(allowlistUrl, {
      headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!allowlistResponse.ok) return json({ ok: false, error: "admin_allowlist_check_failed" }, 503);
    const allowlist = await allowlistResponse.json();
    if (!Array.isArray(allowlist) || allowlist[0]?.enabled !== true) {
      return json({ ok: false, error: "admin_not_allowlisted" }, 403);
    }
  } catch {
    return json({ ok: false, error: "admin_allowlist_check_unavailable" }, 503);
  }

  const names = [
    "SHOPIFY_STORE_DOMAIN",
    "SHOPIFY_ADMIN_ACCESS_TOKEN",
    "CJ_API_KEY",
    "CJ_OPEN_ID",
    "PRINTFUL_API_TOKEN",
  ];
  const secrets = Object.fromEntries(names.map((name) => [name, Boolean(Deno.env.get(name)?.trim())]));
  let domain = Deno.env.get("SHOPIFY_STORE_DOMAIN")?.trim() ?? "";
  domain = domain.replace("https://", "").replace("http://", "");
  while (domain.endsWith("/")) domain = domain.slice(0, -1);
  const domainValid = domain.endsWith(".myshopify.com") && !domain.includes(" ");

  return json({
    ok: true,
    checked_at: new Date().toISOString(),
    project: "VendraHub",
    secrets,
    shopify_domain_valid: Boolean(secrets.SHOPIFY_STORE_DOMAIN && domainValid),
    supabase_server_key_available: Boolean(serviceKey),
    values_exposed: false,
  });
});