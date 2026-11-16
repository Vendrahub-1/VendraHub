# VendraHub

VendraHub is a Next.js commerce starter with separate admin and customer experience routes, plus a Capacitor Android packaging scaffold.

## Supabase application connection

The connected Supabase project is VendraHub (szishzerqvbdvhmysqpv) in eu-west-1. The project now contains the customer/admin schema, RLS policies, verified-owner access controls and AAL2 checks. The Next.js app uses Supabase SSR clients. Never place a Supabase secret/service-role key in browser code or a NEXT_PUBLIC_ variable.

The admin backend has CEO-only authorization using the verified owner identity, the admin_allowlist, and AAL2. The Supplier Hub Edge Function also requires a valid Supabase JWT and checks the owner allowlist server-side. Live authenticated browser testing is still required before treating the full admin experience as production-ready. Supabase Auth still reports leaked-password protection disabled; enable it in Auth password security settings before launch.

## Shopify storefront connection

The customer page reads up to 20 products from the Shopify Storefront GraphQL API. It is read-only: it does not create orders, change inventory, or access customer records. The private Storefront API token is only used by server-side code and must never be exposed in a `NEXT_PUBLIC_*` variable.

1. In Shopify Admin, enable the Headless sales channel and create a private Storefront API access token with only the required product-read access.
2. Copy `.env.example` to `.env.local` and set `SHOPIFY_STOREFRONT_PRIVATE_TOKEN`.
3. Install dependencies and run the app:

```bash
cp .env.example .env.local
npm install
npm run dev
```

The storefront will then be available at `http://localhost:3000/customer`. `GET /api/products` returns a bounded product list and never returns credentials. The app fails closed with a configuration message if the token is not set.

## Supplier connections

VendraHub's Supplier Hub initially lists four supplier apps:

- Syncee AI Dropshipping: https://apps.shopify.com/syncee-1
- DSers: https://apps.shopify.com/dsers
- CJdropshipping: https://apps.shopify.com/cucheng
- Printful: https://apps.shopify.com/printful

Syncee and DSers use their own Shopify app authorisation and catalogue workflows. Installing either app authorises it to work with the Shopify store; it does not automatically grant VendraHub AI direct access to the supplier's private catalogue. Products imported by those apps can be reviewed through the connected Shopify Admin API after they appear in the store.

CJdropshipping can connect through its Shopify app or through the optional direct API. The direct API uses the server-side `CJ_API_KEY` to exchange for a short-lived access token; never expose or commit those credentials.

- CJ API key guide: https://developers.cjdropshipping.com/en/api/start/apikey.html
- CJ product search API: https://developers.cjdropshipping.com/en/api/api2/api/product.html

Printful can connect through its Shopify app and through a server-side API token. The API supports catalogue browsing, but creating and managing Shopify-connected products has separate platform-sync constraints; product imports must use the supported Shopify app workflow.

- Printful Shopify app: https://apps.shopify.com/printful
- Printful API documentation: https://developers.printful.com/docs/

The Supplier Hub's Install links open the official Shopify App Store listing. The merchant must select the VendraHub store and approve Shopify's permission screen. A displayed connection status changes only after a successful verification; a configured secret alone is not proof of a working connection.

The deployed `supplier-hub` Edge Function supports:
- Owner-only status reads for the four supplier connection records.
- CJdropshipping API-key exchange followed by read-only product search through Product List V2.
- Printful API-token verification and read-only product catalogue browsing.
- Read-only Shopify product catalogue search, which can display products already imported through Syncee or DSers.
- Server-side secret handling; API credentials and access tokens are never returned to the browser.

The Supplier Hub UI and function source are being developed on `backend/integration-readiness`. The Edge Function is deployed to Supabase, but the branch frontend has not been deployed to the live store. Syncee/DSers app installation and the live CJ/Printful credential checks still require the owner to complete the corresponding Shopify/API authorisation steps.

## Important safety boundaries

- Supplier product search/import is not run automatically.
- Product imports require explicit product-level approval.
- Paid supplier plans, supplier purchases, live inventory updates, order submission and fulfilment automation remain disabled.
- Do not expose supplier credentials through client components, API responses, logs, or `NEXT_PUBLIC_*` variables.
- The admin UI on the integration branch is not yet deployed to the live storefront.
- Shopify Admin API operations require a separately authenticated and authorised server-side app. Do not reuse a Storefront API token as an Admin API token.

## Routes

- `/` — VendraHub landing page
- `/admin` — owner-only admin workspace and Supplier Hub (integration branch)
- `/customer` — read-only Shopify product storefront
- `/api/products` — server-side Shopify product search (`q` optional, `limit` capped at 20)

## Android packaging

The repository includes Capacitor configuration for Android packaging. APK generation needs Android Studio, Android SDK, Java/Gradle, and for release APKs, a signing keystore. No signed APK is included in this repository.
