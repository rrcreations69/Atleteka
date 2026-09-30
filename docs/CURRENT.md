# Current milestone: M11 - Admin products/categories/inventory

Updated: 2026-09-28. Status: **In Progress**: functional acceptance passed; held, like M07–M10, only for the deferred M03 check and the final QA pass.

M11-P01 (DECISIONS.md): archive over delete; JPEG/PNG/WebP images up to 4 MB checked by content and by the bucket; optimistic stock updates without a log table.

## Implemented behavior

- Migration 20260928073926_admin_catalog_media.sql: products.status limited to active/inactive; product-images bucket limited to 4 MB and image/jpeg, image/png, image/webp; admin-only storage insert/update/delete/select policies (uploads only under products/).
- /admin links to Products, Categories, Inventory. /admin/products lists all products (active and archived) with create; new products start archived. /admin/products/[id]: details and status, options (title, SKU normalized to upper case, price as an exact PHP amount, active; new options get a zero stock row), category checkboxes, images (upload with required alt text, reorder, remove the row and the stored file). /admin/categories: create/edit, activate/deactivate. /admin/inventory: set stock per option; the update applies only if stock still equals what the page loaded.
- lib/admin/actions.ts: every action calls requireAdmin() server-side and uses the admin's session, so RLS and storage policies apply too. Duplicate slug/SKU (23505) return field messages. Images are identified by their bytes (lib/admin/validation.ts detectImage); the stored content type comes from the detected signature. next.config.ts raises the Server Action body limit to 5 MB for uploads.

## Functional verification (2026-09-28, Vercel preview, admin signed in by the user, driven through Claude in Chrome)

| # | Check | Result |
| --- | --- | --- |
| 1 | Customer calls admin writes (RLS, rolled-back transaction); signed-out /admin | PASS; price/stock/status updates change 0 rows, category insert and storage upload denied; admin upload outside products/ denied; invalid status rejected; /admin redirects to /login |
| 2 | Create product; duplicate slug | PASS; created archived; "This slug is already used." |
| 3 | Add option; price 12.345; duplicate SKU; SKU with a space | PASS; HOODIE-M with 0 stock; each invalid input refused with a field message; no invalid option created |
| 4 | Upload a real PNG; text renamed .png; 4.3 MB file | PASS; uploaded and shown from storage; refused by content; refused by size |
| 5 | Create category, assign, publish, category and product pages | PASS after fix 156b97e (checkboxes sent "on" instead of category ids); category page lists the product; product page "In stock" |
| 6 | Set stock; stale second tab | PASS; 0→5→4; stale tab refused with "Stock changed to 4 since this page loaded" |
| — | Remove image; archive product | PASS; image row and storage file removed; archived product hidden from shop and category, data kept |

Unit tests: tests/admin.test.mjs (image signatures, prices, slugs/SKUs, stock). Test data left: archived product "Test Hoodie" (HOODIE-M, stock 4) and active category "Hoodies".

Noted for the final QA pass: missing or archived product pages show the not-found view but return HTTP 200 (streaming loading state; existing M04 behavior).

## M11 CHECKPOINT

- Completed: M11-P01, migration, admin pages and actions, functional tests.
- Exact next action: M12 (admin orders: list/detail, fulfillment status updates).
- Remaining: the deferred M03 check, the pre-hydration 500 fix, the not-found status code, the final QA pass, and Production Vercel variable cleanup before launch.

---

# Previous milestone record: M10 - Customer account

Updated: 2026-09-28. Status: **In Progress**: functional acceptance passed; held, like M07–M09, only for the deferred M03 check and the final QA pass.

No schema or policy change: existing RLS already limits orders/order_items to the owner (admins read all), addresses to the owner (admins included), and customer profile updates to display_name.

## Implemented behavior

- /account links to Your orders, Saved addresses and Settings.
- /account/orders (lib/account/orders.ts listOwnOrders): own orders, newest first, with date (Asia/Manila), item count, status label (unfulfilled → Processing, needs_review → Under review) and total; empty state.
- /order/[id] (getOwnOrder): own order detail with items, SKU, unit and line totals, subtotal, discount, "Tax: Included in prices", "Shipping: Paid to the courier on delivery", amount paid, the delivery address snapshot, and a note for needs_review. Malformed, missing and other users' ids (including an admin viewing a customer's order here) render the same "Order not found". Guest orders are not viewable in accounts (email confirmation is M13).
- /account/addresses: own saved addresses (reuses the checkout reader) with Remove (lib/account/actions.ts deleteAddress: one uuid, owner filter + RLS). New addresses are still saved at checkout (M07-P01). Past orders keep their own snapshot.
- /account/settings: display name only (1–80 characters), email shown read-only, password via the existing reset flow. Role cannot be changed.
- proxy.ts refreshes the session on /order routes too.

## Functional verification (2026-09-28)

| # | Check | Result |
| --- | --- | --- |
| — | Signed out: /account/orders, /account/addresses, /account/settings, /order/[id] | PASS; redirect to /login (local and Vercel preview) |
| — | RLS as customer and admin (rolled-back transaction) | PASS; customer sees own 2 orders/items and own address only, the guest order is invisible, order update and role escalation are denied; admin sees 3 orders but no other user's addresses |
| 1 | Order history | PASS; 2 orders newest first with correct status, item count and total |
| 2 | Order details | PASS; items, SKU, discount 2.50 → 22.50 paid, tax/shipping wording, address, needs_review note |
| 3 | Guest order id and malformed id while signed in as the customer | PASS; "Order not found", no details |
| 4 | Remove saved address (Vercel preview) | PASS; 0 addresses left, orders keep their address |
| 5 | Change display name (Vercel preview) | PASS; saved as "Rr Test", role still customer. Empty-name rejection is enforced server-side but was not browser-checked |

Found during testing: a Server Action form submitted before hydration returns a raw 500 ("Invalid Server Actions request"); recorded in DECISIONS.md as a known issue for the final QA pass (likely the old M03 login 500).

Vercel: branch feat/m10-customer-account has its own branch-scoped Preview variables (NEXT_PUBLIC_APP_URL = https://atleteka-git-feat-m10-customer-account-rr-4c7a.vercel.app); Production unchanged.

## M10 CHECKPOINT

- Completed: account pages, ownership checks, functional tests.
- Exact next action: M11 (admin products/categories/inventory).
- Remaining: the deferred M03 check, the pre-hydration 500 fix and the final QA pass; clean up shared Production Vercel variables before launch.

---

# Previous milestone record: M09 - Webhook & order creation

Updated: 2026-09-28. Status: **In Progress**: functional acceptance passed; held, like M07/M08, only for the deferred M03 check (DECISIONS.md 2026-09-28).

M09-P01 (approved A–F, DECISIONS.md): provider-neutral payment_session_id/payment_id; immutable orders.shipping_address snapshot; payment_status 'paid' and status 'unfulfilled'/'needs_review'; short stock or an over-limit coupon is recorded as needs_review without deducting stock; shipping_total 0 = paid to the courier, tax_total 0 = included in prices.

## Implemented behavior

- Migration 20260928054657_paid_checkout_orders.sql (hosted and local names match). public.record_paid_checkout is security definer with an empty search_path, executable by service_role only. In one transaction it records the event (unique provider_event_id), creates the order (unique payment_session_id) and item snapshots (SKU and names at payment time, charged unit price and quantity), locks and deducts stock once, counts the coupon, and removes the paid lines from the cart. Duplicate events and resends return the existing order. Totals must reconcile or the call fails (P7101).
- POST /api/paymongo/webhook reads the raw body and verifies Paymongo-Signature (HMAC-SHA256 of "t.body", te or li chosen by our key's mode, 5-minute tolerance, timing-safe) before parsing. Other event types or modes get 200 and are ignored. For checkout_session.payment.paid it re-reads the session from PayMongo (GET /v1/checkout_sessions/{id}), requires exactly one paid PHP payment matching our centavo metadata, then calls the function through a service-role client (lib/supabase/service.ts). Logs contain event ids and error codes only.
- Checkout session metadata (lib/payment/actions.ts) now carries per-line variant:quantity:unit centavos, centavo totals and the shipping address JSON; lib/payment/webhook.ts validates it with Zod.

## Environment and setup

SUPABASE_SERVICE_ROLE_KEY and PAYMONGO_WEBHOOK_SECRET are server-only (.env.example). Vercel Preview variables for branch feat/m09-webhook-orders were set with the Vercel CLI (values piped from .env.local, never printed); Production was not changed. Preview Deployment Protection was disabled by the user so PayMongo can reach the endpoint. PayMongo test webhook hook_e5HJPTAUgtKmM1aEQBx28Lz2 → https://atleteka-git-feat-m09-webhook-orders-rr-4c7a.vercel.app/api/paymongo/webhook (checkout_session.payment.paid). Existing shared Production/Preview variables include obsolete STRIPE_* entries and values created from .env.example; review them before any production deployment.

## Functional verification (2026-09-28, PayMongo test mode on the Vercel preview)

| # | Check | Result |
| --- | --- | --- |
| — | Migration dry run inside a rolled-back transaction (first event, duplicate, resend, short stock + over-limit coupon, mismatch, grants) | PASS; nothing persisted |
| 1 | Guest pays and closes the tab at "Payment Received" | PASS; one paid unfulfilled order, item snapshot, Medium 5→4, cart line removed |
| 2 | Signed replay of the same event; new event id for the same session; 10-minute-old signature | PASS; duplicates return 200 with no new order or stock change; stale signature 401 |
| — | Unsigned and forged signatures | PASS; 401 invalid_signature |
| 3 | Signed-in customer with a 10% coupon | PASS; order linked to the account, 25.00 − 2.50 = 22.50, coupon count 0→1, Medium 4→3 |
| 4 | Stock dropped below the cart quantity after Pay, before payment | PASS; paid order recorded as needs_review, stock not deducted |

Test data kept deliberately for M10 (customer orders) and M12 (admin orders): 3 orders (guest unfulfilled, account unfulfilled with coupon, account needs_review) and coupon M09TEST10. Seed stock after tests: Medium 3 (two real test orders), Small restored to 8.

Unit tests added: tests/webhook.test.mjs (signature, event parsing, metadata). Project-wide checks are deferred to the final QA pass.

## M09 CHECKPOINT

- Completed: M09-P01 approval, migration, webhook, metadata, Vercel preview setup, functional tests.
- Exact next action: M10 (customer account: order history/detail, addresses, settings).
- Remaining: the deferred M03 check and the final QA pass before M03/M07/M08/M09 can be Done; review production Vercel variables before launch.

---

# Previous milestone record: M08 - PayMongo payment

Updated: 2026-09-28. Status: **In Progress**: functional acceptance passed; held only for the M07/M03 dependency (one open M03 check).

The user authorized M08 while M03 and M07 stay In Progress for one open M03 check. M08-P01 (DECISIONS.md, PRD 14_DECISION_LOG row 7) replaced Stripe with PayMongo for a Philippines deployment, and the online payment charges the merchandise total after discounts only: the customer pays the courier's shipping fee on delivery.

## Implemented behavior

- /checkout shows **Pay PHP x** only after a fresh total check with the current form. The server action (lib/payment/actions.ts) re-runs checkout_quote for the current owned cart; browser prices, totals, identity and address IDs are never used.
- lib/payment/session.ts converts exact decimal strings to centavos without floating point, re-checks line totals, subtotal and discount, and refuses totals below PayMongo's PHP 1.00 minimum. Lines are itemized without a coupon; with a coupon one exact line carries the discounted total (PayMongo has no coupon object and no negative lines).
- lib/payment/paymongo.ts creates a hosted Checkout Session (POST /v2/checkout_sessions, secret key as Basic auth, server-only, 20 s timeout). Methods: card, GCash, Maya, QR Ph, subject to account enablement. The response is Zod-validated and must be an https URL; error bodies are not logged or shown. Live keys are refused on a non-https app URL.
- The session carries reference_number = cart id and string metadata (cart id/kind, user id, coupon, quote totals, variant:quantity list, shipping = paid_to_courier_on_delivery) plus billing name/address (and email for accounts) for M09.
- /checkout/success says the payment is being confirmed; it marks nothing paid. Cancel returns to /checkout?payment=cancelled with a not-charged message; the cart is unchanged.
- No database writes, stock reservation, order creation or coupon redemption in M08. The verified webhook, orders, inventory and redemption are M09.

## Environment and dependencies

No new package (plain fetch). The `stripe` package added earlier in this session was removed; package files match the previous commit. .env.example now lists PAYMONGO_SECRET_KEY (M08) and PAYMONGO_WEBHOOK_SECRET (M09) in place of the Stripe variables. No schema change.

## Functional verification (2026-09-25/28, PayMongo test mode, user in Chrome)

| # | Check | Result |
| --- | --- | --- |
| 1 | Guest card payment (4343 4343 4343 4345) → PayMongo "Card Payment Received" → /checkout/success | PASS; reference = real cart id, amount and no-shipping note shown |
| 2 | Failed card (3DS "Fail Test Payment") | PASS; PayMongo returns to method selection, nothing paid |
| 3 | Cancel (PayMongo back arrow) | PASS; /checkout?payment=cancelled, cart unchanged |
| 4 | Cart changed between total check and Pay | PASS after fix: Pay refused ("Your cart changed…"); re-check shows the new amount and clears the error |
| 5 | Coupon (10% test code) | PASS; one exact ₱45.00 line with an item/discount description |
| 6 | Signed-in customer | PASS; account cart used, billing email prefilled from the verified session |
| 7 | Empty cart | PASS; no Pay button |

After every payment: 0 orders, stock unchanged, coupon redemption_count 0 (M08 writes nothing). PayMongo methods offered: QR Ph, card, GCash, Maya. Test data (coupon, carts) removed afterwards; seed intact.

Fixes found by testing: shown-amount guard (Pay sends the displayed total and the server refuses a mismatch; compared only, never charged), cancel notice moved to the top, stale payment error cleared on re-check.

Deferred to the final QA pass (DECISIONS.md "Testing cadence"): lint/typecheck/build, mobile/responsive, UI consistency, regression.

Notes: the PayMongo page header shows the account's business name (currently the owner's personal name); set it to Atleteka before launch. The Vercel PR preview uses the test key only; it needs NEXT_PUBLIC_APP_URL set to the preview URL for redirects. No live key until M09 (orders) exists.

## M08 CHECKPOINT

- Completed: M08-P01 approval and PRD/doc updates, implementation, unit tests.
- Exact next action: M09 (webhook and order creation). The single open M03 check is deferred to the final QA pass (DECISIONS.md 2026-09-28); M03, M07 and M08 become Done only after it passes.
- Remaining after M08: resume the single open M03 check (M03_CHECKPOINT.md), then M09 (webhook, orders, inventory, redemption, provider-neutral order columns).

---

# Previous milestone record: M07 - Checkout foundation

Updated: 2026-09-24. Shipping display superseded by M08-P01 (2026-09-25).

## Status

M07 implementation and its feature checks pass. **Milestone status remains In Progress because the M03 dependency is not fully verified.** M06 is complete (M06_CHECKPOINT.md). M08 has not started.

M07-P01 and the merchant policy were explicitly approved: PHP, Philippines-only delivery, tax included in prices, third-party shipping fee pending confirmation, no final payable total until shipping is known, account address save/reuse, and the coupon/database proposal. See DECISIONS.md and PRD 14_DECISION_LOG row 6.

## Implemented behavior

- /checkout is a private, dynamic page reached from the cart. It reuses the secure guest cookie, server-confirmed account identity and separate guest/account carts.
- The minimal shipping address is also the billing address. Zod validates required fields, four-digit Philippine postal code, PH country, lengths and duplicate form fields. Guests retain the address in the current form; signed-in customers save/reuse owned rows in the existing addresses table.
- Account identity comes from getUser(), never browser user/address IDs. Existing RLS enforces address ownership. Sequential identical saves reuse the existing row; concurrent identical saves are not claimed to be globally deduplicated.
- checkout_quote re-reads the current owned cart, active products/variants, prices and available stock. Empty, inactive or above-stock carts cannot produce a quote. Fractional-cent prices fail closed rather than silently change the catalog price.
- Exact PHP amounts come from Postgres numeric and are returned as decimal strings. Tax is included. UI separately labels merchandise total after discounts, pending shipping and pending final payable total. Unknown shipping is never represented as zero/free.
- One trimmed, case-sensitive fixed-PHP or percentage coupon is allowed. Validate active state, start-inclusive/end-exclusive timestamps, supported type/value/precision and global usage_limit against redemption_count. Cap the discount at merchandise subtotal; percentage discounts round half-up to centavos.
- Quotes consume no coupon use, reserve/deduct no inventory, create no order and invoke no payment/carrier service.
- Empty/loading/error/pending states and field-associated errors are implemented. Retry reloads the page so a recovered server is actually queried again. Invalid account sessions fail closed; missing guest cookies reject actions.

## Database, environment and dependencies

Applied migration: supabase/migrations/20260923170726_checkout_calculation.sql.
Local/hosted SQL MD5: 69e1ecfd6b2a3f16dae1f43f0975de19.

Only new business field: discounts.redemption_count, nonnegative integer, not null, default zero. Existing hosted discounts/orders were empty before application. Direct anon/authenticated counter writes are denied, including admin API writes, while existing admin configuration-column grants/RLS remain.

Public checkout_quote(text) is an invoker wrapper; the private privileged function has explicit ownership checks and an empty search_path. The private schema stays unexposed. All quote reads share the calling statement snapshot. Existing addresses and RLS are reused.

No new packages, services, environment variables or secrets. No M08 functionality.

## Acceptance checklist

| Criterion | Status | Evidence |
| --- | --- | --- |
| Minimal PH address collection and approved account save/reuse | PASS | Zod tests and real-account browser save/reload/reuse; duplicate sequential save does not add another row |
| Authoritative current PHP merchandise totals; tax included | PASS | SQL current prices/exact math/rounding tests; browser totals and forged amounts ignored |
| Pending shipping and final payable total | PASS | SQL response fields null; browser explicit pending labels, no payment control |
| Invalid/currently unavailable stock rejected | PASS | Local and hosted tests reject stock reduction, inactive variants and invalid cart quantities; no stock deduction |
| Valid single coupon and invalid/date/usage/type/precision rejection | PASS | Local/hosted coupon matrix, cap and half-up boundary; browser valid/invalid coupon messages and recalculation |
| Ownership, server validation and RLS | PASS | Guest/account/cross-user SQL and browser isolation; address ownership; forged IDs ignored; counter writes denied even to admin clients |
| Empty/loading/error/pending/recovery states | PASS | Empty/pending main browser cases; delayed RPC loading; injected failure then successful fresh-request retry |
| Invalid session and missing/malformed guest cookie | PASS | Recovery browser cases fail closed, replace malformed GET cookie, and reject cookie-less POST without issuing a new identity |
| Accessibility and responsive layout | PASS | Associated labels/errors, keyboard focus; 320/390/1440px no overflow; mobile/desktop screenshots inspected |
| Lint, typecheck, automated tests and build | PASS | Final checks after retry fix exit 0; 28 automated tests pass |
| Migration/database verification | PASS | Two clean PG17 replays, identical schemas, historical-stage regressions, M06/M07 SQL tests, hosted SQL and exact migration hash |
| PRD and scope preservation | PASS | 20 intended cells, dependent dashboard caches and affected row heights only; unrelated values/formulas/styles/native features preserved; scope diff reviewed |
| M03 dependency fully verified | BLOCKED | Admin access, token refresh, registration confirmation and recovery delivery remain unverified; see M03_CHECKPOINT.md |

No known M07 feature test failure remains. The error-retry defect found during verification was fixed and its recovery case now passes. Do not mark the milestone Done while the recorded dependency gate remains open.

## Verification evidence and cleanup

Ignored .verification evidence:
- m07-local-tests.log, m07-schema-a.sql, m07-schema-b.sql; m07-local-check.cjs now uses the applied migration file once.
- m07-app-lint.log, m07-app-typecheck.log, m07-app-test.log, m07-app-build.log.
- m07-browser-results.json / m07-browser.log: 9 grouped cases.
- m07-browser-recovery-results.json / m07-browser-recovery.log: 5 grouped cases, passing after retry fix.
- m07-checkout-mobile.png and m07-checkout-desktop.png.
- m07-prd/verification.json and archive-verification.json; final changed-view renders.
- m07-files.json and m07-final.diff. Repository has no commits; baseline comparison includes untracked files.

Hosted cleanup confirmed users/carts/cart_items/addresses/discounts = 0. Three original products remain; seed inventory is unchanged (S=8, M=5, L=4, towel=0, archived=3). All test users/sessions, product/variant and coupon fixtures were removed. Normal production server runs at http://localhost:3000 with no test fetch hook; process record is .verification/m07-server.json.

Security advisor: no WARN/ERROR. The existing webhook_events table has intentional default-deny RLS without a policy (INFO). No webhook work was added.

Limits: portable PostgreSQL 17 replay uses platform stubs; actual hosted SQL/browser tests supplement it. Full Docker Supabase and native Excel recalculation were not run. Artifact-tool recalculation and original-archive preservation were verified. Quote-time coupon availability does not implement payment-time redemption concurrency. Broader M03 email/session/admin checks remain open.

## PRD and documentation

PRD records M07-P01, approved merchant rules, saved account addresses, the coupon counter/security requirements and actual In Progress status. Dashboard: 17 total, 6 Done, 2 In Progress, 0 Blocked, 9 Not Started. M01-M06 content and M08+ requirements are preserved except directly related address/coupon clarifications approved for M07.

Status correction (2026-09-25, user-authorized): 07_ROADMAP!E4:E9 changed from Not Started to match recorded execution history: M00/M01/M02/M04/M05 Done (verified per ROADMAP.md history and M04/M05 checkpoints), M03 In Progress (implemented; verification incomplete per M03_CHECKPOINT.md). Only those six Status cells and the dependent 15_DASHBOARD cached values changed; formulas, styles, validation and all other workbook parts are byte-identical. No requirement changed. Fresh re-check on 2026-09-25 after `npm ci`: lint, typecheck, 28/28 tests and production build pass. The earlier .verification evidence folder is not present in this checkout.

Approved changes to the original PRD: shipping/final total pending instead of a final quote; PHP/PH/tax policy; account address reuse; coupon semantics and redemption_count. **Unapproved deviations: None.**

All changed files are listed in HANDOFF.md.

## CHECKPOINT

- Completed: approved M07 implementation, feature verification, retry correction, PRD update/preservation, cleanup and documentation.
- Current position: M07 features verified; milestone In Progress solely for the unverified M03 dependency.
- Exact next action: finish the single remaining M03 check (recovery link → same-browser code exchange → new password); see the resume steps in M03_CHECKPOINT.md "Follow-up verification (2026-09-25)". All other M03 checks passed on 2026-09-25. Do not redo completed M07 work.
- Remaining: M03 dependency checks, then reconcile M03/M07 completion status from actual evidence. Do not start M08.
