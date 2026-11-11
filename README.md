# VendraHub

VendraHub is a Next.js commerce starter with separate admin and customer experience routes, plus a Capacitor Android packaging scaffold.

## Shopify storefront connection

The customer page reads up to 20 products from the Shopify Storefront GraphQL API. It is read-only: it does not create orders, change inventory, or access customer records. The private Storefront API token is only used by server-side code and must never be exposed in a `NEXT_PUBLIC_*` variable.

1. In Shopify Admin, enable the Headless sales channel and create a private Storefront API access token with only the required product-read access.
2. Copy `.env.example` to `.env.local` and set `SHOPIFY_STOREFRONT_PRIVATE_TOKEN`. The store domain and API version are configurable there too.
3. Install dependencies and run the app:

```bash
cp .env.example .env.local
# Edit .env.local and set SHOPIFY_STOREFRONT_PRIVATE_TOKEN
npm install
npm run dev
```

The storefront will then be available at `http://localhost:3000/customer`. `GET /api/products` returns a bounded product list and never returns credentials. The app fails closed with a configuration message if the token is not set.

Do not commit `.env.local`, share the private token, or use an Admin API token in the storefront. Shopify Admin data (orders, customer details, inventory management) is not connected: it requires a separately authenticated and authorized admin backend. The existing admin page is sample UI, not a live Shopify admin session.

## Routes

- `/` — VendraHub landing page
- `/admin` — admin dashboard UI prototype (sample data only)
- `/customer` — read-only Shopify product storefront
- `/api/products` — server-side Shopify product search (`q` optional, `limit` capped at 20)

## Android packaging

The repository includes Capacitor configuration for Android packaging. APK generation needs Android Studio, Android SDK, Java/Gradle, and for release APKs, a signing keystore. Follow `android/README.md` for local setup. No signed APK is included in this repository.

## Security and production readiness

- Configure secrets only in local environment or the deployment provider's secret manager.
- Use HTTPS in production and restrict the Storefront API token to the minimum needed access.
- Add real admin/customer authentication before exposing private data or protected operations.
- Verify the deployed site's API version and test Shopify error handling before launch.
