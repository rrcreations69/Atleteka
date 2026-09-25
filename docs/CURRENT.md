# Current milestone: M07 - Checkout foundation

Updated: 2026-09-24.

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

PRD records M07-P01, approved merchant rules, saved account addresses, the coupon counter/security requirements and actual In Progress status. Dashboard: 17 total, 1 Done, 1 In Progress, 0 Blocked, 15 Not Started. M01-M06 content and M08+ requirements are preserved except directly related address/coupon clarifications approved for M07. Historical workbook milestone statuses other than M06/M07 remain unchanged.

Approved changes to the original PRD: shipping/final total pending instead of a final quote; PHP/PH/tax policy; account address reuse; coupon semantics and redemption_count. **Unapproved deviations: None.**

All changed files are listed in HANDOFF.md.

## CHECKPOINT

- Completed: approved M07 implementation, feature verification, retry correction, PRD update/preservation, cleanup and documentation.
- Current position: M07 features verified; milestone In Progress solely for the unverified M03 dependency.
- Exact next action: resume the remaining existing M03 authentication verification; a user-controlled test mailbox is needed before confirmation/recovery delivery tests. Do not redo completed M07 work.
- Remaining: M03 dependency checks, then reconcile M03/M07 completion status from actual evidence. Do not start M08.
