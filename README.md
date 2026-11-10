# VendraHub
Online store 
### VendraHub WebMCP implementation plan

We’ll plan an Imperative WebMCP integration for the VendraHub Shopify admin app. The first release will be strictly read-only: browser-based AI agents can request approved information through named tools, but cannot change products, update inventory, create discounts, fulfill orders, or modify store settings.

Implementation status: Planning only. No code changes, Shopify mutations, or production deployment.

### 1\. Proposed agent tools

These are proposed paths, not yet implemented. They assume the admin app has a secure server-side connection to your existing Shopify store, `vendrahub-store.myshopify.com`.

1\. `search_products`

Read-only

Inputs

* `query` — product name or keyword

* `limit` — maximum results, capped at 20

Outcome

Returns matching product names, IDs, status, prices, and available inventory summaries where authorized.

2\. `get_inventory_summary`

Read-only

Inputs

* `product_id` — optional Shopify product ID

* `limit` — maximum results, capped at 20

Outcome

Returns authorized inventory quantities and location-level summaries, where available. No stock adjustments.

3\. `list_orders`

Read-only

Inputs

* `status` — optional supported order status

* `limit` — maximum results, capped at 20

Outcome

Returns order number, creation date, status and totals in NGN where provided by Shopify. Customer contact details and full addresses are excluded.

4\. `get_sales_summary`

Read-only

Inputs

* `start_date` — reporting period start

* `end_date` — reporting period end

Outcome

Returns available sales totals and order counts for the requested period, subject to Shopify API permissions and data availability. Sales are not represented as net profit.

5\. `get_store_overview`

Read-only

Inputs

\- No required inputs

Outcome

Returns permitted store information, currency, timezone, and high-level product and order counts when available.

### 2\. Technical approach

* Register the five tools with `document.modelContext.registerTool(...)`, after feature detection.

* Use a compatible WebMCP-enabled browser over HTTPS; leave the normal human-facing app usable if WebMCP is unavailable.

* Call your app’s authenticated server endpoints. Never expose Shopify access tokens in browser code.

* Use Shopify Admin GraphQL for new integration work, with the minimum required API scopes.

* Return structured, bounded results with clear errors and pagination limits.

### 3\. Security boundaries

| Area             | Proposed rule                                                              |
| ---------------- | -------------------------------------------------------------------------- |
| Authentication   | Require an authenticated, authorized admin session                         |
| Authorization    | Enforce permissions on the server for every request                        |
| Privacy          | Return only fields needed for the requested task                           |
| Data integrity   | No writes, mutations, or background changes                                |
| AI safety        | Treat product descriptions and customer-supplied content as untrusted data |
| Audit            | Log tool name, actor, timestamp and outcome without logging credentials    |
| Failure handling | Fail closed when authorization or Shopify connectivity cannot be verified  |

The AI tools will not receive Shopify secrets, MFA codes, session tokens, or unrestricted customer records. WebMCP tool registration itself is not an authorization boundary; the backend must enforce access controls.

### 4\. Verification plan

Before calling the work complete, we will:

* Inspect the actual VendraHub app source and identify its framework and Shopify authentication flow.

* Confirm the server endpoints and permissions required for each proposed tool.

* Implement only the paths you approve.

* Test tool discovery and execution in a compatible browser, including invalid inputs, unauthorized sessions, API errors, and attempts to invoke writes.

* Report what passed, what failed, and what remains unverified.

Your Shopify store connection was previously verified, but the separate admin app’s source and deployment are not yet verified here. We will not claim successful integration until the tests pass.

### 5\. Approve the proposed paths

Do you approve these five read-only tools as the first WebMCP release, or would you like to change the list? Once you approve the paths, we can proceed to source inspection and implementation planning without deploying or changing production.

WebMCP progress: Design proposed · Runtime not changed · Implementation awaiting approval · Browser testing pending · Security hardening pending.
