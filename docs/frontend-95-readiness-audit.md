# VendraHub frontend readiness audit

Audit date: 2026-11-27
Repository: `Vendrahub-1/VendraHub`
Audited source: customer-navigation PR head `fa1ab92bb85f560e5ed82bf824481ade4572de06` (PR #18), compared with `main` `c41d4c70bcb18e5b163e577d30c6c448637a953d`.

## Safety and scope

- Read-only inspection of repository files, GitHub pull request metadata, and CI check results.
- No production Worker, DNS, domain, database, or payment settings changed.
- PR #18 remains an open draft. It was not merged.
- A separate remediation branch, `feat/frontend-95-readiness`, was created from the PR head to protect `main` and preserve the customer work.
- This is a source-code audit, not a live authenticated end-to-end acceptance test.

## Verified repository and CI facts

- The repository is a Next.js 15 / React 19 TypeScript application with customer and admin route groups.
- PR #18 adds customer categories, product detail, cart, orders, wishlist, bottom navigation and sidebar routes.
- PR #18 is open and draft; it has not been merged into `main`.
- CI checks on the PR head report success for TypeScript/Next.js production build, Cloudflare Workers builds for both Worker services, CodeQL, dependency audit and customer preview deployment/smoke-test workflow.
- The customer preview workflow checks that seven routes return HTTP 200. This does not verify authenticated flows, real cart persistence, successful payment, order creation, or admin operations.

## Customer frontend — screen-by-screen findings

| Screen / route | Source evidence | Audit finding |
|---|---|---|
| Storefront home `/customer` | Shopify product search, hero, category shortcuts, search, product cards, support shortcuts | UI and live Shopify product-read path exist. Search results are limited to 20. Product card checkout starts a one-item checkout; no add-to-cart flow is exposed. |
| Categories `/customer/categories` | Hard-coded category tiles and live product grid | Page exists. Category tiles route to a query search; no native Shopify collection/category mapping or per-category product filtering is implemented on this page. |
| Product detail `/customer/products/[handle]` | Shopify search then find by handle; checkout button | Detail UI exists. It searches only the first 20 returned products, exposes only the first variant, and has no add-to-wishlist or multi-variant selection UI. |
| Shopping bag `/customer/cart` | Static explanatory content | Placeholder only. No persistent multi-item cart, quantity editing, item removal, subtotal, shipping estimate or cart checkout UI. |
| Customer login/register `/customer/login` | Supabase sign-in and sign-up | Sign-in and registration UI/actions exist. Email confirmation behavior is surfaced. Password-reset journey is not present on this page. |
| Customer account `/customer/account` | Supabase profile, addresses, support, wishlist API calls | Profile update, address creation/removal and support-ticket creation/listing are implemented in code. Account page handles guest state. Wishlist data is fetched but its dedicated UI was moved to the separate wishlist page. |
| Orders `/customer/orders` | Static order status labels and empty-state content | Placeholder only. No customer order query, order detail, payment status, fulfilment tracking, cancellation or return request workflow. |
| Wishlist `/customer/wishlist` | Authenticated API GET/DELETE and list UI | View and remove are implemented. No product-page action currently adds a product to the wishlist. Items display a Shopify product ID rather than resolved product details. |
| Customer navigation | Sidebar and five-item bottom navigation | Navigation components exist. Must be tested on device for overlap, keyboard focus, route correctness and logged-in/logged-out states. |
| Customer support | Account page and `/api/customer/support` | Ticket create/list path exists with input validation and per-user query. No customer-facing ticket reply/update workflow is evidenced. |

## Admin frontend — screen-by-screen findings

The admin navigation defines 13 entries: Overview, Products, Orders, Customers, Suppliers, Inventory, Sales & Finance, Customer Support, AI Assistant, Staff & Access, Notifications, Reports & Analytics, and Settings & Health.

| Screen / route | Source evidence | Audit finding |
|---|---|---|
| Overview `/admin` | Supabase support/audit/supplier counts, metrics, cards | Shell and basic counts exist. Sales/order analytics are explicitly empty/not connected. Product/order/customer sections are readiness placeholders. |
| Products `/admin/products` | Generic admin section reads `products` | Read-only latest-record table (up to 12). No product create/edit/publish/archive, image management, search, filtering or pagination. |
| Orders `/admin/orders` | Generic admin section reads `orders` | Read-only latest-record table. No order detail, status updates, fulfilment, cancellation, returns or refund operations. |
| Customers `/admin/customers` | Generic admin section reads `customers` | Read-only latest-record table. No customer detail, search, account support actions or privacy workflow. |
| Suppliers `/admin/suppliers` | Supplier status cards and table | Connection state can be displayed; suppliers are awaiting authorization / not verified. No completed product import or order routing. |
| Inventory `/admin/inventory` | Generic admin section reads `inventory_items` | Read-only stock view. No stock adjustment, alerts, supplier sync or SKU mapping UI. |
| Sales & Finance `/admin/finance` | Pricing calculator and sales-record table | Pricing calculator exists; sales rows are read-only. No reconciled payments, refunds, costs/fees or verified analytics. |
| Customer Support `/admin/support` | Generic admin section reads `support_tickets` | Read-only ticket list. No assignment, reply, status change, escalation or resolution workflow. |
| AI Assistant `/admin/assistant` | Prompt suggestions and disabled input | UI placeholder; explicitly says connect AI service first. No working chat/model connection or agent tools. |
| Staff & Access `/admin/staff` | Generic admin section reads `admin_profiles` | Read-only list. Role/identity management actions are not implemented. |
| Notifications `/admin/notifications` | Generic admin section reads `system_alerts` | Read-only list. No notification preferences, delivery, retries or acknowledgement actions. |
| Reports `/admin/reports` | Generic admin section reads `sales_records` | Read-only table. No report filters, date ranges, export or reconciled analytics. |
| Settings & Health `/admin/settings` | Static configuration/security cards | Mostly informational. No editable settings or live health/integration diagnostics. |

## Cross-application and launch blockers

1. **Hostname routing mismatch:** `middleware.ts` recognises legacy `vendrahub.com` and legacy Worker hostnames only. It does not recognise the intended `shopvendrahub.com`, `www.shopvendrahub.com`, or `admin.shopvendrahub.com` hostnames. Domain activation can wait, but routing must be made configurable and tested before domain launch.
2. **Checkout/cart mismatch:** the checkout API accepts multiple cart lines, but the storefront exposes a single-product “Buy now” action and the cart screen is not wired to it.
3. **Order system gap:** customer order history is not connected to Shopify customer orders or a verified local order ledger.
4. **Admin operations gap:** most admin screens are read-only views, not business management tools.
5. **Payments gap:** repository evidence shows Shopify Storefront cart checkout only. Paystack, Flutterwave, PayPal, Shopify Payments eligibility/configuration, card gateway processing and physical gift-card redemption are not verified as implemented.
6. **Documentation drift:** README still describes the database as clean/no migrations and the admin as a preview, while the repository now contains multiple Supabase migrations and stronger auth/role code. Documentation needs updating after implementation is verified.
7. **Live testing gap:** CI builds and route smoke tests pass, but no authenticated customer or admin journey, payment sandbox flow, or order fulfilment acceptance test has been demonstrated.

## Recommended remediation sequence

### Customer
1. Implement persistent multi-item cart and cart UI using the existing Shopify cart mutation endpoint.
2. Add product-to-wishlist action and resolve saved product details.
3. Connect customer order history to an authorised order source; implement order details and tracking states.
4. Improve product discovery: collection/category filtering, pagination, full catalogue product detail lookup and variant selection.
5. Complete customer account UX: password recovery, address editing/default selection, ticket details and account-state handling.
6. Add payment options only through verified gateway integrations and sandbox tests.

### Admin
1. Establish a shared admin data-access pattern with role checks, server-side validation, audit logging and approval boundaries.
2. Implement product management (create/edit/publish/archive) and image handling.
3. Implement order detail, fulfilment status, cancellation and returns/refund approval flows.
4. Implement customer and support management, including ticket replies/status/assignment.
5. Implement inventory and supplier connection health/synchronisation with explicit approvals for purchases/imports/live stock changes.
6. Connect reports to reconciled transaction/order data.
7. Connect the AI assistant to a model and scoped tools; keep consequential actions approval-gated.
8. Implement staff/role management and editable settings only after permissions and audit coverage are tested.

### Shared QA
- Preserve main and the existing open customer PR; develop only on `feat/frontend-95-readiness`.
- Run TypeScript, production build, accessibility checks and route smoke tests after each change.
- Add authenticated browser/API tests for customer and admin journeys.
- Use sandbox/test payment credentials only; never run live charges during verification.
- Do not modify production DNS, Workers, database policies, live supplier settings or payment settings without separate approval.


## Customer feature implementation update

Implemented on `feat/frontend-95-readiness` after the initial audit:

- Added a shared wishlist state provider and save/remove buttons on the storefront product cards and product detail page. The existing authenticated `wishlist_items` API remains the source of truth; unauthenticated customers are directed to sign in.
- Expanded Shopify Storefront product queries to return up to 20 variants per product, including variant IDs, availability, selected options, and variant prices.
- Added product-detail variant selection, quantity selection, add-to-bag, and buy-now actions. Checkout still hands off to Shopify and validates the returned HTTPS `.myshopify.com` destination.
- Replaced the static customer orders page with live order history from Shopify Admin GraphQL, scoped to the signed-in customer's verified Supabase email. The response is private/no-store and includes line items, financial/fulfilment statuses, and carrier tracking URLs when Shopify provides them.
- Added customer order filters and shipment tracking display. Orders without carrier data are explicitly shown as awaiting tracking rather than inventing a tracking status.

### Dependencies and verification boundaries

- Shopify Admin API credentials must have the required order-read access and any Shopify protected-customer-data approval required by the store. If those scopes are unavailable, the order API returns an unavailable state rather than showing fabricated orders.
- Shopify checkout must retain the customer's email matching their verified VendraHub account for orders to appear in this email-scoped lookup. Guest checkouts using a different email will not be matched.
- This is Shopify order history; orders from Paystack/Flutterwave/PayPal or supplier channels are not yet unified into a VendraHub order ledger.
- Carrier scans and delivery estimates depend on fulfilment providers supplying tracking data to Shopify.
- No Supabase schema, RLS policy, live Shopify configuration, production deployment, DNS, or production data was changed.
- Automated build verification is required for the latest branch head; live authenticated checkout/order tests remain pending.

- Order filters use Shopify's actual cancellation timestamp and fulfilment enums rather than assuming a made-up `CANCELLED` fulfilment state.
- Shopify Admin API access to historical orders is subject to the store's granted scopes; without Shopify's `read_all_orders` approval, Shopify's default order visibility may be limited to the most recent 60 days.
