# VendraHub

VendraHub is a Next.js commerce application with separate admin and customer routes, plus a Capacitor Android packaging scaffold.

## Supabase application connection

The connected Supabase project is VendraHub (`szishzerqvbdvhmysqpv`) in `eu-west-1`. Its project URL is prefilled in `.env.example`; add the project's publishable key to the deployment environment. The publishable key is designed for browser use, but database access must still be protected with Row Level Security (RLS). Never place a Supabase secret/service-role key in browser code or a `NEXT_PUBLIC_*` variable.

The current database includes `profiles`, `support_tickets`, `wishlist_items`, `supplier_connections`, `store_settings`, `audit_events`, and `customer_addresses`. RLS is enabled on these public tables and the schema is tracked by Supabase migrations. Admin access is gated by the Supabase session, verified owner identity, and AAL2 authenticator MFA in middleware and corresponding owner-only database policies. The owner identity is pinned consistently in the application and database policies; changing it requires a coordinated code and policy update followed by an access-control test.

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

## Admin integration status

The admin route has owner-only Supabase authentication and MFA gating. Its current workspace is an initial, responsive control-centre shell. The overview reads the existing support-ticket, audit-event, and supplier-connection records from Supabase.

Products, orders, customer administration, inventory, sales/profit reporting, support inbox, notifications, and AI operations are not yet connected to a Shopify Admin API or equivalent live data service. Those panels are intentionally shown as not connected rather than inventing business data. A separate server-side Shopify Admin API integration with merchant-authorised OAuth and least-privilege scopes is required before those modules can display or modify live Shopify data. Do not reuse the Storefront API token as an Admin API token.

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
- Keep the admin owner identity and database RLS policies in sync.
- Never expose a Shopify Admin API token to browser code.

## Routes

- `/` — VendraHub landing page
- `/admin` — owner-authenticated admin workspace
- `/admin/login` — owner sign-in
- `/admin/mfa` — authenticator MFA challenge/enrolment
- `/customer` — read-only Shopify product storefront
- `/api/products` — server-side Shopify product search (`q` optional, `limit` capped at 20)

## Android packaging

The repository includes Capacitor configuration for Android packaging. APK generation needs Android Studio, Android SDK, Java/Gradle, and for release APKs, a signing keystore. No signed APK is included in this repository.
