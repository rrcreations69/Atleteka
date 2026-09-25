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

## Follow-up verification (2026-09-25, times PHT)

Environment: production build (`next start`) at http://localhost:3000 against hosted Supabase vaqkikxksbblgspdeiap; .env.local holds only the public URL, publishable key and NEXT_PUBLIC_APP_URL. Hosted migrations match all six local files. Lint, typecheck, 28/28 tests and build pass. Browser actions were performed by the user in the Claude app browser pane; database/log evidence via the Supabase MCP. User-approved cleanup first removed stale 2026-09-24 fixtures (two example.invalid users, a plain-address Gmail user, the "M03 verification fixture" product); seed restored to three products.

| Check | Result | Evidence |
| --- | --- | --- |
| Anonymous /admin | PASS | Redirects to /login |
| Registration | PASS | rrai.creatives+customer@gmail.com created unconfirmed, profile role customer, success message shown |
| Confirmation email | PASS | mail.send confirmation 3:00 PM; link confirmed the account (email_confirmed_at 3:07:42 PM). Link was opened by an outside browser, so the same-browser code exchange is covered by the recovery check instead |
| Customer sign-in / old HTTP 500 | PASS | Lands on /account; no Server Actions error. Wrong passwords returned the generic message (Auth 400 invalid_credentials) |
| HttpOnly session cookies | PASS | document.cookie exposes no cookies |
| Customer blocked from /admin | PASS | Redirected to /account |
| Revoked session | PASS | Server session deleted: /account → /login, /cart falls back to the guest cart |
| Sign-out (customer and admin) | PASS | 0 sessions, 0 live refresh tokens; protected routes redirect to /login |
| Token refresh | PASS | Natural 3600 s expiry: reload after expiry rotated refresh token #13 → #14 (parent set, refreshed_at 4:33:08 PM), user stayed signed in; next reload made no further refresh |
| Admin access | PASS | rrai.creatives+admin@gmail.com (confirm-email temporarily disabled by the user for this signup, then re-enabled; role granted by one approved SQL UPDATE): /admin shows administrator access, /account shows role admin and Open admin |
| Recovery email | PASS | mail.send recovery 4:33:48 PM and 4:59:18 PM, received by the user |
| Recovery link → same-browser code exchange → new password | PENDING | See findings |

Findings:
- Single-use email links are consumed by any prefetcher. Both confirmation links and two recovery links were opened by Discordbot link previews (the user's message relay) before they could be used; one was used by an outside Chrome. Real users behind mail/link scanners can hit the same "link invalid or expired" result. Possible mitigation (proposed only, not approved): token_hash email templates with an explicit confirm step.
- The built-in Supabase mailer is limited to about 2 emails per hour. When it is exceeded, recovery shows the same generic message by design and sends nothing (Auth 429 over_email_send_rate_limit). Production needs custom SMTP (the Resend integration is M13).
- The user's temporary 300 s access-token expiry setting did not take effect (tokens were still accepted after 5 min 40 s). The refresh check therefore used the natural expiry; the setting is restored to 3600.
- Security advisor: webhook_events no-policy INFO (intentional) and a leaked-password-protection WARN (Auth setting, not a schema issue).

Paused 2026-09-25 ~6:00 PM PHT at the user's choice: recovery requests at 5:03–5:55 PM all returned 429 (the built-in mailer limit, stricter than 2/hour in practice). M03 and M07 remain In Progress; the workbook is unchanged.

Resume (single remaining check): keep rrai.creatives+customer@gmail.com (customer) and rrai.creatives+admin@gmail.com (admin, to be kept). Start the production server; in the Claude browser pane open /login?mode=recover and request **one** reset for +customer. The user sends **only the pkce_ token**, never the URL (Discord previews consume links). Build `https://vaqkikxksbblgspdeiap.supabase.co/auth/v1/verify?token=<token>&type=recovery&redirect_to=http://localhost:3000/login`, fetch it with `curl --max-redirs 0`, and open the Location `?code=` URL in the pane (it holds the PKCE verifier). Expect /login?mode=reset; the user sets a new password and lands on /account. If this passes, set M03 and M07 to Done (07_ROADMAP!E7 (M03) and E11 (M07) plus dashboard caches, via direct XML), then delete the +customer account.
