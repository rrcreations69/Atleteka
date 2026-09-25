# M03 checkpoint before authorized M04

M03 is implemented but **not fully verified**. The user explicitly advanced to M04 on 2026-09-17. Do not report M03 as complete.

## Completed

- Auth forms/actions, HTTP-only Supabase SSR cookies, profile provisioning, server identity/admin guards and RLS.
- Hosted migration 20260916110141_auth_profiles_and_rls.sql applied; local SQL matches the migration submitted.
- Two clean PostgreSQL 17 replays, prior M02 tests at the M02 stage, and transactional M03 ownership/admin/role/payment tests passed.
- The same SQL access tests passed on hosted Supabase.
- Lint, typecheck, six Node validation tests and production build passed before the final invalid-link redirect fix.
- Anonymous protected routes, registration labels, expired reset and invalid callback behavior passed browser checks.
- Invalid callback redirect loop fixed in proxy.ts and its browser case passed.
- Hosted advisors: no WARN/ERROR; intentional webhook no-policy INFO and unused-index INFO.
- Two disposable Auth browser fixtures were removed when work advanced; verified zero remaining fixture users. No email sent to those fixtures.

## Unfinished / actual failure

- Browser login submission produced HTTP 500 / "Invalid Server Actions request." The generic invalid-credentials message was not reached. Cause is not established.
- Customer/admin login/logout/session refresh and end-to-end route authorization still require browser verification.
- Registration confirmation and password recovery email delivery are unverified; no user-controlled test mailbox was supplied.
- Final checks after the last proxy edit, documentation reconciliation and final M03 scope audit remain.
- Do not treat SQL role tests as evidence that browser auth works.

## Evidence and resume

Local ignored evidence: .verification/m03-baseline, m03-local-tests.log, m03-schema-a.sql, m03-schema-b.sql, m03-browser.cjs, m03-error-debug.png and m03-login-mobile.png.
Start with the Server Actions request failure when M03 follow-up is authorized. M04 public catalog depends on M01/M02 in the PRD; it must not depend on an authenticated session.

## Later M06 evidence (2026-09-23)

Customer login/logout and separate account-cart persistence passed against actual hosted Supabase with two disposable users at http://localhost:3000. The prior Server Actions failure was not reproduced; its original cause remains unestablished. This limited evidence does not complete M03: admin access, token-refresh behavior, registration confirmation and recovery delivery still require their recorded checks. All M06 test users and sessions were removed.
