# Current milestone: M06 - Cart

## Status

M06 implementation and acceptance verification are complete (2026-09-23). M07 has not started. Stop here.

The user explicitly approved M06-P01: narrow cart routines/RLS over existing tables, server stock and price validation, a 30-day secure guest cookie with hash-only storage, separate guest/account carts and no automatic merge. The implementation follows that approval without a new product or architecture decision.

M04/M05 remain verified. M03 is not fully verified: real customer login/logout worked in M06 testing, but the remaining M03 admin/session-refresh and email confirmation/recovery checks are separate. See M03_CHECKPOINT.md.

## Implemented behavior

- Product variant controls add a positive whole quantity. Adding the same variant increments its single line atomically.
- /cart supports quantity updates, explicit removal, current PHP unit prices/line totals/subtotal, and empty/loading/error/pending states.
- Proxy issues a random 256-bit guest secret on product/cart GET requests. Cookie: HttpOnly, SameSite=Lax, host-only, Path=/, Max-Age=2592000; Secure and __Host- prefix when the configured application URL is HTTPS. Plain HTTP is only allowed for localhost development by existing configuration.
- Only the server-read cookie supplies x-cart-token to Supabase. Existing carts.guest_token stores SHA-256 hashes; secrets/hashes do not enter UI, URLs or logs.
- Account operations require getUser() verification and auth.uid() database ownership. Guest credentials cannot override account ownership. Login opens the separate account cart; logout restores the browser's guest cart. No merging.
- Invalid sessions fail closed. Missing guest cookies block mutations and request a refresh; POST does not issue a competing identity. Cookie/session responses are private and not cacheable.
- Zod validates mutation fields and RPC payloads. Duplicate quantity/operation/variant fields are rejected. Browser price, subtotal, owner and cart identifiers confer no authority.
- Existing database routines check current active state and stock and calculate all amounts. UI formats exact decimal strings without converting them to floating point.
- Changed stock produces a quantity warning. Inactive lines use unavailable placeholders/null prices and are excluded from subtotal; they remain removable.
- No reservations, stock deductions, checkout, discounts, shipping/tax, orders or payments were added.

## Database and environment

Applied migration: supabase/migrations/20260921065011_cart_access_and_mutations.sql.
Local/hosted SQL MD5: 990d61d8bac66043463e95a3a64be5e4.

The migration reuses carts/cart_items, adds narrow RPC/private helpers, owner-only RLS, direct-write restrictions and one active-cart-per-user partial index. Public wrappers are SECURITY INVOKER; private-schema USAGE remains denied. No business table or column was added.

No further database changes were needed for application integration. No packages, services, architecture changes or environment variables/secrets were added.

## Acceptance checklist

| Criterion | Status | Evidence |
| --- | --- | --- |
| Add/update/remove; one line per variant with atomic increments | PASS | SQL/API concurrency tests; browser adds/updates and removal to empty state. |
| Positive integer quantities; current stock and active variants enforced | PASS | Zod tests; invalid/overflow SQL/API tests; browser negative/above-stock rejection; changed-stock warning and reduction. |
| Guest persistence with approved secure 30-day cookie | PASS | Cookie attributes/HTTPS option unit tests; HttpOnly browser check, expiry, reload and restored-browser-session persistence. |
| Server-confirmed account ownership; guest/account and cross-user separation | PASS | Real login/logout with two disposable accounts; guest and account quantities stay separate; SQL/RLS isolation and forged-header denial. |
| Authoritative prices, line totals and subtotal | PASS | Browser price/subtotal/owner tampering ignored; changed database prices reflected; exact decimal formatting tested. |
| Unavailable item handling | PASS | Inactive placeholders, excluded subtotal, disabled update and explicit removal verified in browser. |
| Empty/loading/error/pending/recovery states | PASS | Empty cart and pending add; delayed RPC loading; injected read failure and successful retry; invalid-session and missing-cookie messages. |
| Keyboard, labels and responsive mobile/desktop UI | PASS | Associated quantity label/error, keyboard focus; 320/390/1440px browser checks; no overflow; screenshots reviewed. |
| Lint, typecheck, tests and production build | PASS | Application-stage logs: lint/typecheck/build exit 0; 22 automated tests pass. No application source changes after these checks. |
| Migration/database checks | PASS | Two clean PG17 replays with identical schema; staged historical tests; hosted SQL/API/concurrency/isolation checks; unchanged migration hash. |
| Cleanup and scope audit | PASS | Browser fixture users/carts/items removed; three original products and all five original stock values retained. Diff contains M06 implementation and documentation only. |
| PRD completion update and consistency | PASS | M06 marked Done; progress text updated; unrelated requirements, styles, formulas and native features preserved; dashboard recalculated and changed views checked. |

No M06 FAIL or BLOCKED acceptance criterion remains.

## Verification evidence

Ignored local evidence is under .verification/:

- m06-database-checkpoint.json, m06-local-tests.log, m06-schema-a.sql, m06-schema-b.sql, m06-concurrency-results.json and m06-api-results.json.
- m06-app-lint.log, m06-app-typecheck.log, m06-app-test.log, m06-app-build.log.
- m06-browser-results.json (10 grouped checks), m06-browser-stock.log, m06-browser-inactive.log, m06-browser-recovery-results.json (5 grouped checks): 17 grouped browser checks total.
- m06-cart-mobile.png and m06-cart-desktop.png.
- m06-app-final.diff and m06-app-files.json.
- m06-prd-completion/verification.json and archive-verification.json.

Browser testing used the production build at http://localhost:3000 and actual hosted Supabase. A temporary Node fetch hook exercised loading/error states; it was removed from the running server. No test hook exists in application code. Disposable fixture users had no email delivery.

Limits: HTTPS cookie configuration is unit-tested; browser checks used localhost HTTP. Full Docker Supabase and native Excel recalculation were not run. Artifact-tool recalculation and saved formula caches were verified. These limits do not establish production deployment or M03 completion.

## PRD and document consistency

The approved M06 requirements remain unchanged. Completion updates only 07_ROADMAP!E10/F10 and the M06-P01 progress note at 14_DECISION_LOG!D5, plus dependent dashboard calculation caches. M01-M05 and M07+ requirements/statuses are preserved.

Dashboard: 17 total, 1 Done, 0 In Progress, 0 Blocked, 16 Not Started. Other historical workbook statuses are intentionally preserved; read milestone checkpoints for their actual execution history.

No PRD deviation or new proposed PRD change. See HANDOFF.md for the complete changed-file list and continuation instructions.

## CHECKPOINT

- Completed: remaining M06 browser checks, fixture cleanup, final scope review and completion documentation/PRD.
- Current position: M06 verified; normal local production server running at http://localhost:3000.
- Next action: review this completed milestone. Before M07 implementation, explicitly authorize completing the remaining M03 verification dependency.
- Remaining: no M06 work. M03 verification remains separate; M07 is unstarted.
