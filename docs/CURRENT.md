# Current milestone: M08 - PayMongo payment

Updated: 2026-09-25. Status: **In Progress** (implementation done; browser verification waits for PAYMONGO_SECRET_KEY).

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

## Verification so far

Lint, typecheck and 35/35 Node tests pass (7 new payment tests: centavo conversion, reconciliation, fail-closed carts, minimum charge, itemized and discounted lines, description length).

Pending (needs a PayMongo test key from a KYC-verified account in .env.local): session creation, redirect to PayMongo, test payment, failed payment, cancel, cart changed between quote and pay, empty cart, account vs guest billing email, mobile/desktop.

## M08 CHECKPOINT

- Completed: M08-P01 approval and PRD/doc updates, implementation, unit tests.
- Exact next action: when PAYMONGO_SECRET_KEY is present, build, start the server and run the pending browser checks; then record results and decide M08 status.
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
