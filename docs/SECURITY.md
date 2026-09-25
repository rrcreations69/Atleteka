# Security and verification requirements

Derived from PRD.xlsx 03_ARCHITECTURE, 05_DATA_MODEL, 06_RLS_AUTH, 08_USER_STORIES, 10_ENV_INTEGRATIONS, 11_TEST_MATRIX, 12_AI_GUARDRAILS, and 13_MASTER_PROMPT, plus the user's security/payment invariants.

## Authentication and authorization

Supabase Auth owns identity/sessions. profiles extends auth.users with safe profile data and customer/admin role. Public shoppers can read active/published catalog data and derived availability. Customer resources need both server ownership checks and RLS. Admin mutations require server-confirmed admin role and applicable RLS. Never treat hidden buttons or an /admin URL as authorization. Customers cannot promote themselves by updating role or ownership fields.

The following is transcribed from the workbook, including the questionable inventory/Public row. Its Policy / Server Rule says “Expose internal adjustment controls,” which conflicts with derived availability/admin-only adjustment. That text is recorded as a source inconsistency, not permission to expose controls; see DECISIONS.md.

| Resource | Role | Action | Policy / Server Rule | Never Do |
| --- | --- | --- | --- | --- |
| products/categories | Public | Read | Only active/published rows | Expose drafts/admin-only fields unnecessarily. |
| products/categories | Admin | Create/Update/Archive | Server confirms admin; RLS/write policy admin only | Authorize solely because /admin UI is hidden. |
| inventory | Public | Read derived availability | Expose internal adjustment controls | Allow direct public writes. |
| inventory | Admin | Adjust | Admin-only trusted mutation | Let client set arbitrary stock without role check. |
| carts/cart_items | Guest | Own cart | Owner-only RLS via hashed guest secret; secure 30-day cookie. Narrow server routines validate stock/quantity and calculate prices/subtotals. Direct client table writes denied. | Trust cart price values stored by browser. |
| carts/cart_items | Customer | Own cart | user_id = auth.uid(); verified session and owner-only RLS. Guest credentials cannot override account identity. Separate carts; no automatic merge. Mutations use validated routines. | Read another user cart. |
| addresses | Customer | CRUD own | user_id = auth.uid() | Allow user_id override. |
| orders/order_items | Customer | Read own | orders.user_id = auth.uid() or secure guest order access strategy | Query arbitrary order IDs without ownership check. |
| orders | Public/Customer | Create indirectly | Created only through trusted checkout/payment path | Create paid order directly from client. |
| orders | Admin | Read/update fulfillment | Admin server check; payment_status changes tied to payment system | Manually mark payment paid from untrusted form. |
| profiles | Customer | Read/update own safe fields | id = auth.uid(); role not user-editable | Let customers promote own role. |
| webhook_events | Service | Create/read | Server/service key only | Expose service-role key to browser. |

## Trust boundaries

Validate relevant forms, server actions, handlers and external payload assumptions with Zod. Client validation improves UX only. Never trust browser prices, totals, discounts, inventory, payment status, role, ownership or order status. Re-fetch authoritative data and enforce positive quantities, active products/variants, current stock and discount limits on the server.

Product uploads require admin authorization and file-type/size validation. The PRD supplies no exact limits. Serve only appropriate catalog media and do not expose unnecessary draft/internal fields. Treat error states as recoverable without leaking stack traces, secrets or PII.

## Payment invariants

1. Receive cart identifiers and quantities, not authoritative prices.
2. Reload current product/variant prices and stock. Reject inactive/unavailable items and invalid quantities.
3. Validate the single discount and compute authoritative totals server-side.
4. Create the Stripe checkout/payment resource server-side with safe internal references.
5. Treat the browser redirect as navigation only; it cannot mark an order paid.
6. Verify the Stripe webhook signature and deduplicate the provider event.
7. Finalize trusted order/payment state, immutable line snapshots and inventory adjustment, atomically where possible. Totals must match the charged amount.
8. Trigger confirmation from trusted paid state, exactly once. Log email failure without corrupting the order.

Duplicate events and retries must not create duplicate orders, inventory deductions or emails. Closing the browser after paying must not prevent finalization. A unique webhook event ID alone is not verification of all these outcomes: use the launch matrix and chosen implementation's failure/retry tests.

## Environment and secrets

.env.example contains placeholders only. Keep real environment files/secrets out of version control. SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and RESEND_API_KEY are server-only and must never enter client bundles or logs. Public Supabase credentials depend on correct RLS. Use separate preview/production configuration on Vercel and scrub secrets/PII from Sentry and logs. Environment names are transcribed in ARCHITECTURE.md.

## Verification and launch gates

Security and money test failures block completion. Run lint, typecheck and relevant tests after meaningful changes. Verify customer cross-user denial, direct admin mutation denial, role escalation prevention and storage restrictions. Check responsive behavior, semantic HTML, labels, keyboard/focus operation and associated form errors where relevant. The tests below are target requirements, not passed results.

| ID | Area | Scenario | Expected Result | Type | Launch Gate |
| --- | --- | --- | --- | --- | --- |
| T-001 | Checkout | Successful payment | Exactly one paid order created with correct totals/items; inventory adjusted; confirmation path works. | E2E | P0 |
| T-002 | Payments | Failed payment | No paid order/fulfillment; user sees recoverable failure state. | E2E | P0 |
| T-003 | Payments | Cancelled checkout | Cart/order draft remains safe; nothing marked paid. | E2E | P0 |
| T-004 | Webhook | Duplicate event | Second processing is no-op/idempotent; no duplicate order/email/inventory deduction. | Integration | P0 |
| T-005 | Checkout | Browser closes after payment | Webhook still finalizes trusted order state. | Integration | P0 |
| T-006 | Inventory | Item becomes out of stock during checkout | Server rejects or safely reconciles before final purchase per chosen strategy. | Integration | P0 |
| T-007 | Security | Client changes $100 price to $1 | Server ignores client price; charge uses DB/validated amount. | Abuse | P0 |
| T-008 | Security | Quantity = -5 | Validation rejects. | Abuse | P0 |
| T-009 | Security | Customer requests another user order ID | Access denied/not found. | Abuse | P0 |
| T-010 | Security | Customer calls admin mutation directly | Denied server-side/RLS. | Abuse | P0 |
| T-011 | Discount | Invalid/expired coupon | Rejected with clear message; totals unchanged. | Integration | P1 |
| T-012 | Discount | Attempt coupon reuse above rule | Server enforces rule/limit. | Abuse | P1 |
| T-013 | Catalog | Inactive product direct URL | Not purchasable; 404/unavailable handling. | Integration | P1 |
| T-014 | Cart | Quantity exceeds stock | Server rejects/clamps per defined UX; no checkout bypass. | Integration | P0 |
| T-015 | Auth | Customer edits role field | Role escalation impossible. | Abuse | P0 |
| T-016 | Storage | Invalid product upload type/size | Rejected. | Security | P1 |
| T-017 | Responsive | Core path on small mobile viewport | Browse → product → cart → checkout usable without overflow/blockers. | Manual/E2E | P1 |
| T-018 | Accessibility | Keyboard/form labels/error messaging sanity | Critical forms usable and errors associated with fields. | Manual | P1 |

## M00 verification boundary

M00 adds a static root page and tooling. No Auth, RLS, uploads, checkout, webhooks or deployment exists. No commerce security claim or launch-test pass is made. .env.example has empty credential placeholders; .gitignore excludes real environment files, keys, build/dependency output and verification artifacts. M00 verifies tooling and secret-exclusion conventions only; later security implementation stays in its milestones. M15 performs the dedicated abuse review, and M16 closes critical P0/P1 launch defects.

## M02 verified database boundary

All 14 application tables now have RLS enabled. PUBLIC, anon and authenticated table privileges are revoked; no access policy or Auth hook exists. service_role receives only SELECT/INSERT/UPDATE/DELETE grants on these tables. No service key is obtained or stored. The order_items trigger rejects updates/deletes, preserving historical line snapshots.

Tests passed locally and on hosted Supabase for grants, RLS denial even with temporary test grants, invalid values, foreign keys, duplicate records and snapshot immutability. Test fixtures/grants roll back. This establishes default denial, not the future M03 customer/admin access matrix or commerce launch tests.

The existing rls_auto_enable() event-trigger helper had client EXECUTE grants flagged by the advisor. A migration revoked PUBLIC/anon/authenticated execution while preserving the function and trigger. The final security advisor has no WARN/ERROR findings; 14 expected [RLS Enabled No Policy informational notices](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) describe deliberate M02 default denial. Full permission policies remain M03 work.

## M04 public catalog boundary

M03 grants/policies are now present and SQL-tested; M03 browser Auth is not fully verified. M04 storefront queries use an anonymous Supabase server client, explicit active predicates and Zod validation. Admin cookies never elevate storefront access. Public derived availability uses a security-invoker view plus a restricted private read-only helper that independently checks active product/variant state. Exact inventory counts and all public writes remain denied. Media paths are confined to the public product-images bucket; no client storage-write policy or upload workflow is added.

Catalog UI state is display only. No cart, payment or stock mutation exists. M04 cannot establish later purchase integrity or launch readiness.

## M06 cart boundary (verified)

M06-P01 was explicitly approved. Guest access uses a bearer secret whose hash is stored in existing guest_token; the application issues it with the approved 30-day HttpOnly/SameSite=Lax cookie and Secure on HTTPS (__Host- prefix). Only the server-read cookie is forwarded to Supabase. Invalid account sessions fail closed, and missing guest cookies block mutations until refresh. Proxy overwrites its internal session-error header. Responses are private/no-store. Authenticated cart ownership is auth.uid(); a guest header cannot override it or merge carts.

The applied migration removes direct client cart writes and limits reads with RLS. Private privileged routines explicitly check ownership, validate operation/quantity/active state/current stock, and calculate amounts from database prices. Public wrappers remain invoker, private schema USAGE stays denied, and execution grants are explicit. Neither raw inventory nor guest hashes appear in cart payloads. Concurrent adds serialize; no reservation, stock deduction, order or payment behavior exists. Local and hosted isolation/bypass/concurrency tests pass. Real login/logout, cross-account and guest separation, persistence, tampering, missing/malformed cookie, invalid-session and browser recovery checks pass. See CURRENT.md. No new environment secret or client credential exposure was introduced.

## M07 checkout boundary

M07-P01 is explicitly approved. /checkout is private/no-store and covered by the existing proxy cookie/session checks. Invalid account identity fails closed. Zod validates address/coupon inputs and RPC responses; browser totals, rates, counters, owner IDs and address IDs have no authority. Account address writes derive user_id from getUser(), and existing RLS enforces ownership. No PII is put in URLs or application logs.

The owner-checked quote routine reads current catalog/stock/coupon values under a statement snapshot. The private schema remains unexposed; wrappers are invoker, privileged private functions have an empty search_path and explicit identity checks. Raw inventory and the discount table are not exposed to shoppers. Direct client redemption_count writes are denied even to an admin account. No secret/service-role key is added. Shipping/final payable totals are null; no trusted paid state, inventory mutation, reservation or coupon consumption is implemented.

Local/hosted SQL tests cover guest/account isolation, stock changes, coupon eligibility/limits, precision/rounding and counter-write denial. Browser tests verify tampering, saved-address isolation and account/guest separation. See CURRENT.md for the final verification state. Quote checks are not payment-time concurrency guarantees.
