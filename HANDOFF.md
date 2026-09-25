# M07 handoff

Updated: 2026-09-24. **M07 features are implemented and verified. M07 remains In Progress because the M03 dependency is not fully verified. M08 has not started.**

## Authoritative continuation position

Do not restart M06 or reimplement M07. Read AGENTS.md, CURRENT.md, relevant PRD rows and derived docs before continuing. Verify this handoff against actual code/evidence.

The last unfinished M07 feature check was error recovery. It failed because resetting the error boundary did not fetch checkout again. app/checkout/error.tsx now reloads the page on Try again. Final lint/typecheck/28 tests/build and all 5 recovery browser cases pass after that fix.

**Exact next action:** finish the single remaining M03 check (recovery link → same-browser code exchange → new password) per M03_CHECKPOINT.md "Follow-up verification (2026-09-25)". Admin access, token refresh, confirmation/recovery delivery, revoked session and the login 500 all passed on 2026-09-25. Preserve all completed M07 work and its evidence. Close M03/M07 status only from actual results. Do not begin M08.

## Approvals already received

No further approval is needed for these implemented M07 choices:
- PHP; Philippines delivery; tax included in prices.
- Third-party shipping fee unknown. Display pending shipping and merchandise total after discounts; final payable total remains pending.
- Save/reuse signed-in customer addresses for later orders using existing addresses. Guest address remains transient.
- M07-P01 coupon/database proposal: one fixed/percentage coupon, case-sensitive trimmed code, discount capped at subtotal, percentage rounded half-up to centavos, protected global redemption_count and owner-checked read-only quote.
- No quote-time consumption, inventory reservation/deduction, order creation, Stripe or carrier integration. No new packages/environment secrets.

Explicit approvals supersede the old pending-decision assessment. They are recorded in DECISIONS.md and PRD 14_DECISION_LOG row 6.

## Verified implementation

- /checkout, loading/error states and interactive address/coupon form; cart navigation.
- Server-confirmed account/guest identity via existing cart utility/proxy, private/no-store responses, Zod input/result boundaries.
- PH address validation; account save/reuse with derived user_id and existing RLS. No browser ownership/address ID trusted.
- Authoritative current numeric prices/stock/coupon rules, returned as exact decimal strings. Shipping/final total null, tax included.
- Empty/unavailable/above-stock carts and invalid/expired/exhausted/unsupported coupons rejected.
- One new field: discounts.redemption_count, nonnegative default zero. Direct client writes denied even for admin accounts.
- Migration: supabase/migrations/20260923170726_checkout_calculation.sql; local/hosted MD5 69e1ecfd6b2a3f16dae1f43f0975de19.
- Public invoker wrapper/private privileged helper, empty search_path, explicit identity checks; private schema remains closed.
- Repeated sequential identical address submissions reuse a row. Global concurrent address deduplication is not claimed or required.

## Verification and remaining gate

PASS:
- Two clean PG17 replays with identical schemas; staged historical regressions and M06/M07 SQL tests.
- Hosted SQL tests, exact migration hash, no advisor WARN/ERROR (only intentional webhook_events no-policy INFO).
- Final lint, typecheck, all 28 automated tests and production build.
- 9 main browser groups: empty/private response, authoritative/pending totals, coupon/pending/tamper checks, address/coupon validation, responsive/accessibility checks, guest isolation, saved-address persistence/reuse, real login/logout and cross-account separation, no runtime errors.
- 5 recovery browser groups: delayed loading, failure/retry recovery, invalid session, malformed cookie replacement, missing-cookie action rejection.
- Mobile/desktop screenshots reviewed; 320/390/1440px no overflow.
- PRD: 20 intended cell edits plus affected row heights/dependent cached calculations; zero unexpected values, cell styles or native-feature changes. Unrelated ZIP parts and unrelated XML inside changed parts are preserved. Changed views/dashboard inspected.
- Scope review: no M08 route/payment behavior, dependencies, environment changes or unrelated refactor.

BLOCKED:
- Broader M03 admin/session-refresh and email confirmation/recovery verification. Real customer login/logout passed again in M07; that is not full M03 completion.

M07 has no known feature FAIL. Its workbook status remains In Progress solely for the dependency gate. Full per-criterion report: docs/CURRENT.md.

## Cleanup and local state

Hosted fixtures removed: users=0, carts=0, cart_items=0, addresses=0, discounts=0. Three original products and original five inventory quantities retained (S8/M5/L4/towel0/archived3). Test sessions were removed with the fixture users.

Normal production server: http://localhost:3000. .verification/m07-server.json records current PID and testHook:false. Verify process identity before restarting. Temporary fetch hook is confined to ignored .verification and is not loaded by the normal server or application.

The portable PG17 cluster .verification/m02-pgdata was started on its default port 5432 in this session (not the historical 55432). The M07 replay runner reflects port 5432. Never print its ignored password. Docker Supabase was not run.

## Files created in M07

- docs/M06_CHECKPOINT.md (preserves the completed M06 report)
- app/checkout/page.tsx
- app/checkout/loading.tsx
- app/checkout/error.tsx
- components/checkout/checkout-form.tsx
- lib/checkout/actions.ts
- lib/checkout/data.ts
- lib/checkout/validation.ts
- tests/checkout.test.mjs
- supabase/tests/m07_checkout.sql
- supabase/migrations/20260923170726_checkout_calculation.sql

## Files modified in M07

- AGENTS.md
- HANDOFF.md
- proxy.ts
- app/cart/page.tsx
- docs/CURRENT.md
- docs/ARCHITECTURE.md
- docs/DATABASE.md
- docs/SECURITY.md
- docs/DECISIONS.md
- docs/ROADMAP.md
- docs/PRD.xlsx
- supabase/README.md

No file deleted; no package/lockfile/environment change. Approved PRD changes are recorded; unapproved deviations: none.

## Evidence and tooling

- .verification/m07-baseline contains 89 original files and SHA-256 manifest. Do not overwrite. Repository has no commits, so ordinary git diff omits untracked files.
- .verification/m07-files.json, m07-final.diff, m07-final-checkpoint.json.
- m07-local-tests.log, m07-schema-a.sql, m07-schema-b.sql.
- m07-app-{lint,typecheck,test,build}.log.
- m07-browser-results.json/log; m07-browser-recovery-results.json/log.
- m07-checkout-mobile.png, m07-checkout-desktop.png.
- m07-prd/verification.json, archive-verification.json and after-*.png.
- Current PRD SHA-256: 7164da6253c04596b32b830052a3391670c8c6a3be4412d36c9109790688561c (after the 2026-09-25 status correction; previously 4ff719966d036bc3bbbb260ba052c5cdc334c6ef781a1d46fb290eed501b5f43).
- Workbook dashboard: 17 total, 6 Done, 2 In Progress, 0 Blocked, 9 Not Started. M00/M01/M02/M04/M05/M06 Done; M03/M07 In Progress. See CURRENT.md "Status correction".
- m07-prd/edit.mjs --verify-only reads the final workbook. Do not rerun edit mode after later changes: it starts from the original snapshot. Artifact-tool authoring/recalculation plus preservation scripts retain native workbook features; native Excel was not run.
- Supabase project: vaqkikxksbblgspdeiap, existing MCP, no service-role secret.
- Windows sandbox setup can fail. Reviewed require_escalated Node/cmd execution works. A previous diagnostic was blocked by exhausted workspace credits; the next user continuation retried the same approval path successfully. Never bypass a rejection.

## CHECKPOINT

- Completed in this session: retry fix and final checks, recovery verification, PRD visual/preservation checks, scope review, fixture cleanup, documentation and handoff.
- Current position: M07 features verified; M03 dependency gate open.
- Next thing to do: verify the existing M03 admin/session-refresh paths and obtain a user-controlled mailbox for confirmation/recovery tests.
- Remaining: finish M03 verification and reconcile M03/M07 statuses. No M08 work.
