# VendraHub

VendraHub is a Next.js 15 / React 19 commerce platform with separate customer and owner-admin experiences, a Shopify catalogue integration, Supabase authentication/data services, and a Capacitor Android packaging scaffold.

## Current platform architecture

- **Customer storefront:** `/customer` — Shopify product discovery, product detail, variant selection, wishlist, browser-persisted multi-item cart, customer account, addresses, support and order history.
- **Owner administration:** `/admin` — owner sign-in with authenticator MFA, Shopify product management, order/customer/inventory visibility, support-ticket status management, reporting workspaces and approval-gated AI assistance.
- **Supabase:** project `szishzerqvbdvhmysqpv` in `eu-west-1`. The application uses cookie-based Supabase SSR clients and Row Level Security. Customer profile, wishlist, address and support routes use the signed-in user's identity. Admin APIs verify the owner session, AAL2 MFA, active admin profile and super-admin role server-side.
- **Shopify:** Shopify remains the current catalogue and order system of record. Storefront API access is read-only; the separately authenticated Admin API is used for protected product-management and operational read workflows.

The Supabase project has application tables and RLS policies. It is not an empty/clean database. The current local `products`, `product_variants`, `orders`, `order_items` and `payment_records` tables contain no operational records; the live catalogue and Shopify order history are currently read from Shopify where the required credentials and scopes are available.

## Customer experience

- Storefront search and product cards use the Shopify Storefront GraphQL API.
- Product detail is fetched directly by Shopify product handle and includes available variant options and variant-specific prices.
- Wishlist changes are stored for the signed-in customer in Supabase.
- Cart items are persisted in the customer's browser storage. The cart is not yet synchronised across devices.
- Customer order history uses the verified sign-in email to look up matching Shopify orders. Tracking is shown only when Shopify provides fulfilment/tracking data.
- Customer profile, delivery-address and support-ticket APIs require a signed-in customer and return private, no-store responses.

## Owner administration

- Admin routes require the owner identity, AAL2 authenticator verification, an active admin profile and a super-admin role.
- Product workspace supports Shopify product listing/search/status filtering, draft creation, product editing, and confirmed publish/unpublish actions. Product deletion is intentionally not exposed.
- Orders, customers and inventory are currently read-only views. Support ticket status changes are confirmation-gated and audited.
- AI assistance is a server-side drafting/research copilot. Approval records represent a human decision; they do not automatically execute the proposed business action.
- Shopify Admin API permissions and any required protected-customer-data approval must be configured in Shopify before those views/actions can work against live store data.

## Shopify configuration

Set the following values in the deployment secret manager. Do not commit real credentials or expose private values through `NEXT_PUBLIC_*` variables.

- `SHOPIFY_STORE_DOMAIN` — for example, `vendrahub-store.myshopify.com`.
- `SHOPIFY_STOREFRONT_API_VERSION` — currently `2026-10`.
- `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` — server-side Storefront API token with the required product-read scope.
- `SHOPIFY_ADMIN_API_VERSION` — currently `2026-10`.
- `SHOPIFY_ADMIN_ACCESS_TOKEN`, or the app credentials `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET` for the server-side client-credentials token exchange.
- Admin API scopes must match the specific feature: product read/write, order read, customer read, and inventory read. Customer data access may also require Shopify approval.

## Supabase configuration

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are the browser-safe project configuration.
- Never put a Supabase secret/service-role key in browser code or a `NEXT_PUBLIC_*` variable.
- Keep RLS enabled and review policies against the actual customer/owner access model before adding new tables or endpoints.
- `ADMIN_RECOVERY_COOKIE_SECRET` is a server-side secret used to sign short-lived owner password-recovery proofs.

## Payments and live operations — paused

Payments are deliberately not part of this platform build phase. The existing Shopify checkout handoff is disabled by default in both the server API and customer UI:

- `CHECKOUT_ENABLED=false` — server-side enforcement; the API rejects checkout creation unless explicitly enabled.
- `NEXT_PUBLIC_CHECKOUT_ENABLED=false` — customer UI display flag; this is not a security control by itself.

Do not enable either flag until the platform has passed the agreed tests and the owner separately approves the payment integration and launch. The Supabase `operational_safety` settings currently keep payments, live order processing, supplier purchases, product imports, inventory changes and fulfilment automation disabled. Do not enable those settings as part of frontend testing.

## Supplier connections

VendraHub uses the Shopify-app-first approach for Syncee and DSers. Their standard store-owner workflows connect through each supplier's Shopify app and Shopify's merchant-authorised OAuth flow; do not invent or request API tokens for these app-first connections. Install each app from Shopify Admin, confirm the correct store, and review the requested permissions before authorising.

- Syncee installation guide: https://help.syncee.com/en/articles/8886065-how-to-install-syncee-to-your-shopify-store
- DSers Shopify connection guide: https://help.dsers.com/link-shopify-store/

CJdropshipping can connect through its Shopify app. A separate direct CJ API integration is optional. For that route, create an API key in the CJ account's API settings, then follow CJ's documented access-token flow. Store the key and returned tokens only in a server-side secret manager.

- CJ API key guide: https://developers.cjdropshipping.com/en/api/start/apikey.html
- CJ API development flow: https://developers.cjdropshipping.com/en/api/start/development.html
- CJ API authentication: https://developers.cjdropshipping.com/en/api/api2/api/auth.html

A configured supplier secret is not proof of a working connection. Supplier purchases, subscriptions, imports, stock changes and supplier order submission remain disabled until separately tested and approved.

## Hostname routing

Application middleware recognises the planned customer hosts `shopvendrahub.com` and `www.shopvendrahub.com`, and the admin host `admin.shopvendrahub.com`, while retaining the previous VendraHub hostnames for compatibility. This is application routing only; it does not change registrar nameservers, DNS records, Cloudflare routes or production deployment.

## Local development and verification

```bash
cp .env.example .env.local
npm install
npx tsc --noEmit
npm run build
npm run dev
```

The GitHub Actions workflow `.github/workflows/build.yml` runs the vinext compatibility check, TypeScript verification and Next.js production build on pushes and pull requests. A successful build does not replace authenticated customer/admin acceptance testing against the connected Shopify and Supabase services.

## Android packaging

The repository includes Capacitor configuration for Android packaging. APK generation needs Android Studio, Android SDK, Java/Gradle, and for release APKs, a signing keystore. No signed APK is included in this repository.
