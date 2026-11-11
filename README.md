# VendraHub

VendraHub is a Next.js commerce starter with separate admin and customer experience routes, plus a Capacitor Android packaging scaffold.

## Supabase application connection

The connected Supabase project is VendraHub (szishzerqvbdvhmysqpv) in eu-west-1. Its project URL is prefilled in .env.example; add the project's publishable key to your local environment or hosting configuration. The publishable key is designed for browser use, but database access must still be protected with Row Level Security (RLS). Never place a Supabase secret/service-role key in browser code or a NEXT_PUBLIC_ variable.

The Supabase project is currently a clean database with no application tables or migrations. The Next.js application integration (SSR auth clients, session handling, schema and RLS policies) is not yet implemented. Do not treat the admin preview as authenticated until that work is complete and tested.

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

VendraHub uses the Shopify-app-first approach for Syncee and DSers. Their standard store-owner workflows connect through each supplier's Shopify app and Shopify's merchant-authorised OAuth flow; do not invent or request API tokens for these app-first connections. Install each app from the Shopify Admin Apps area, confirm the correct store, and review the requested permissions before authorising.

- Syncee installation guide: https://help.syncee.com/en/articles/8886065-how-to-install-syncee-to-your-shopify-store
- DSers Shopify connection guide: https://help.dsers.com/link-shopify-store/

CJdropshipping can also connect through its Shopify app. A separate direct CJ API integration is optional. For that route, create an API key in the CJ account's API settings, then follow CJ's documented access-token flow. The key and returned access/refresh tokens must be stored in a server-side secret manager; never send them in chat or commit them to Git.

- CJ API key guide: https://developers.cjdropshipping.com/en/api/start/apikey.html
- CJ API development flow: https://developers.cjdropshipping.com/en/api/start/development.html
- CJ API authentication: https://developers.cjdropshipping.com/en/api/api2/api/auth.html

The admin page reports whether the optional `CJ_API_KEY` environment variable is configured, but that is not an API connectivity test. Syncee and DSers status must be verified inside their respective apps after OAuth completes.

## Important safety boundaries

- Supplier product search/import is not run automatically.
- Product imports require explicit product-level approval.
- Paid supplier plans, supplier purchases, live inventory updates, order submission and fulfilment automation remain disabled.
- Do not expose supplier credentials through client components, API responses, logs, or `NEXT_PUBLIC_*` variables.
- The admin page is currently a development preview, not an authenticated production admin boundary.
- Shopify Admin API operations require a separately authenticated and authorised server-side app. Do not reuse a Storefront API token as an Admin API token.

## Routes

- `/` — VendraHub landing page
- `/admin` — admin workspace preview (not production-authenticated)
- `/customer` — read-only Shopify product storefront
- `/api/products` — server-side Shopify product search (`q` optional, `limit` capped at 20)

## Android packaging

The repository includes Capacitor configuration for Android packaging. APK generation needs Android Studio, Android SDK, Java/Gradle, and for release APKs, a signing keystore. No signed APK is included in this repository.
