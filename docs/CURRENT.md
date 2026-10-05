# START HERE (session handoff, 2026-10-05 PHT)

Read this section first; everything below it is history. Verify against the code and `git log` before acting.

## Where things stand
- **Production:** https://atleteka.vercel.app runs `main` (functions in Singapore, `vercel.json`). The local repo is the inner `Atleteka/` folder (GitHub rrcreations69/Atleteka). Work on a branch, open a PR, and merge only when the user says "merge #N".
- **Merged and live (2026-10-02 to 10-05, last merge 4c825ef):** M08-M16 (#2-#10), sin1 region (#11), "Studio" modern minimal design and demo catalog (#13, D-DESIGN-02), navy and crimson palette (#14, D-DESIGN-03), landing-style home with scrollable featured hero (#15, D-DESIGN-04), UI/UX review fixes and add-to-cart confirmation panel (#16), header cart count badge (#17), cart page redesign (#18: two columns with a sticky order summary, thumbnails, quantity stepper; components/cart/cart-line-controls.tsx), Home link in the header navigation (#19; Accessories shows from 1280 px), checkout and payment-submitted redesign (#21: Cart / Delivery / Payment steps, sticky summary with thumbnails and inline coupon, "Confirm address and total" then "Pay"; server re-quote unchanged), account area (#22: shared signed-in layout components/layout/section-shell.tsx with a side menu, order status badges, order details panels), slim catalog filter bar (#23), admin pages on the same layout with a dashboard (#24), docs (#25, #26: ROADMAP.md shows the real M16 status), brand settings file lib/brand.ts for rebranding the store (#27: name, logo, copy, colors; README "Rebranding the store"), favicon, link-preview card, robots.txt and sitemap.xml generated from the brand settings (#28), sorting and "You may also like" (#29, D-REL-01), branded order confirmation email (#30), next/image resizing of product photos (#31). Every page now uses the Studio design. Verified after #31: a demo order on production (Canvas Tote Bag, PHP 690, guest) completed and the branded confirmation email arrived. Superseded: the warm design (#12, D-DESIGN-01).
- **Goal (2026-10-05):** the user plans to sell the whole site to one buyer. Pitch with the demo first; live payments, the buyer's own accounts (Vercel, Supabase, PayMongo, Resend, Sentry, domain) and the buyer's products come after the sale.
- **Demo mode:** production uses PayMongo TEST keys and the test webhook hook_e5HJPTAUgtKmM1aEQBx28Lz2 points at production (DECISIONS.md "Demo checkout on production"). Demo card 4343 4343 4343 4345, any future expiry, any CVC. Order emails only reach raymund.bermudes21@gmail.com (Resend test sender, M16-P01); other recipients are logged as `email_rejected` and acknowledged.
- **Catalog:** 14 demo products and 28 generated transparent illustrations (scripts/demo-catalog: `node scripts/demo-catalog/generate-images.mjs`, then `node --env-file=.env.local scripts/demo-catalog/seed.mjs [--replace-images]`). Re-running the seed resets demo stock. Old fixtures and categories are inactive. Replace with real products and photos before launch.
- **PRD status:** PRD.xlsx 07_ROADMAP: M00-M07 Done (M03 and M07 closed 2026-10-05, user-approved, after the password-reset check passed), M08-M15 In Progress, M16 Not Started; dashboard 8/17 Done. In reality M16 is in progress (ROADMAP.md "Current state"); further workbook changes need the user's approval. Edits are cell-level only (sheet XML replaced via ZipArchive, all other parts verified unchanged). D-DESIGN-01 to 04, the UI/UX review and the cart badge are recorded in DECISIONS.md (the cart redesign, Home link, #21-#24 redesigns and #27-#31 polish are not) but not yet in the PRD decision log (next free row: 15).

## Open items (user's call; set aside items stay parked until the user raises them)
1. Before launch: real products and photos; PayMongo live key, live webhook and its secret in Vercel Production; verified Resend domain and EMAIL_FROM (no domain yet, guest-checkout soft launch per M16-P01); rotate the database password; enable Supabase leaked-password protection.
2. Set aside by the user: PayMongo live keys (deliberately after the sale). The M03 password reset passed on 2026-10-05 on the user's phone (M03_CHECKPOINT.md).
3. Pitch preparation (next): a demo walkthrough script and a one-page feature sheet for the buyer.
4. Not yet checked on production: signed-in account and admin pages (verified on a local production build; phone width checked at about 660 px only).
5. Paperwork: PRD decision-log rows for D-DESIGN-01 to 04, D-REL-01 and later UI decisions; close milestones in the PRD once launch items are done.

## How to operate
- **New branch preview:** set branch-scoped Preview variables (NEXT_PUBLIC_APP_URL = `https://atleteka-git-<branch-with-dashes>-rr-4c7a.vercel.app`, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PAYMONGO_SECRET_KEY, NEXT_PUBLIC_SENTRY_DSN) with one `vercel env add NAME preview <branch> --force --yes` per variable, values piped from .env.local, then `vercel redeploy <deployment-url> --target preview`. Auto mode blocks Claude from writing these variables (and from merging without the user's literal "merge #N"), so the user runs the variable command; #18, #19 and #21-#24 were merged after local production-build checks without a Vercel preview.
- **Permissions:** the outer folder's `.claude/settings.local.json` (user-added) allows `vercel.cmd env add/rm` and `gh.exe pr edit/merge`. Auto mode blocks other secret writes, credential reads and unreviewed merges; never work around a denial.
- **Known third-party quirk:** the phone field on PayMongo's hosted payment page does not check length while typing; our checkout has no phone field.
- **Testing:** the user's Chrome via Claude in Chrome. In a background tab, mouse clicks often miss buttons and smooth scrolling does not animate; use `button.click()` through javascript_tool and instant scrolls. Chrome stops hydrating pages when its window is hidden or minimized (ask the user to bring it forward), and its minimum window width is about 660 px. For 375 px use the in-app browser's mobile preset (it now hydrates; separate cookies, not signed in) or ask the user to zoom Chrome to 175%. Auto mode blocks Supabase production reads; confirm orders on /admin/orders instead.
- **Design rules:** Studio layout; palette ink #181A2F, navy #242E49, slate #37415C, crimson #B4182D (primary actions), wine #54162B (hover), apricot #FDA481 (dark surfaces only); Instrument Sans; 2 px corners; no text under 12 px; copy states only what the store does.

---

# Current milestone: M16 - QA & launch

Updated: 2026-09-30. Status: **In Progress**. Branch feat/m16-qa-launch, stacked on feat/m15-security-review (PR #9). PR #10 opened against feat/m15-security-review. Authorized by the user ("start M16").

## Final QA pass (local production build, 2026-09-30)

| Check | Result |
| --- | --- |
| Lint | PASS after removing an unused Sentry hint parameter (lib/monitoring/sentry-options.ts) |
| Typecheck, 51 automated tests, production build | PASS |
| Not-found HTTP status (known issue) | **Fixed**: removed app/(catalog)/loading.tsx; its Suspense boundary streamed a 200 before notFound(). Missing and inactive products and categories now return 404; valid pages 200; /account and /admin redirect signed-out users to /login |
| SEO core metadata (PRD 02_SCOPE: title, description, canonical, OpenGraph basics) | **Added**: metadataBase from NEXT_PUBLIC_APP_URL, site description and OpenGraph defaults (lib/seo.ts); product and category titles, descriptions, canonical URLs and OG tags (first product image when present); /shop canonical; sign-in and register titles. Verified in the rendered HTML |
| Responsive 320px and 1440px (home, shop, search, product, not-found, cart, checkout, login, register) | PASS; no horizontal overflow |
| Accessibility sanity (T-018 basics) | PASS; lang=en, one main and one visible h1 per page, no unlabeled inputs, nameless buttons/links or images without alt. The second h1 on cart/checkout is an unswapped hidden streaming chunk in the non-hydrating pane |
| Performance sanity | Catalog TTFB 0.19-0.42 s (database round trip), static pages under 30 ms; HTML 3-6 KB |

Trade-off: catalog pages no longer show a loading skeleton; during client navigation the current page stays until the next is ready.

## E2E critical path (2026-09-30, M16 preview, PayMongo test mode, user's Chrome via Claude in Chrome)

Setup (user-approved): branch-scoped Preview variables for feat/m16-qa-launch (9, values piped from .env.local, APP_URL = branch URL), redeployed; PayMongo test webhook hook_e5HJPTAUgtKmM1aEQBx28Lz2 moved from the M13 preview to https://atleteka-git-feat-m16-qa-launch-rr-4c7a.vercel.app/api/paymongo/webhook (events unchanged: checkout_session.payment.paid).

| # | Step | Result |
| --- | --- | --- |
| 1 | Product page, sold-out variant | PASS; Medium "Sold out", Small "In stock" |
| 2 | Add to cart, cart totals | PASS; Small × 1, subtotal PHP 25.00 |
| 3 | Checkout with a test address (QA Tester, Makati City) | PASS; server quote PHP 25.00, shipping paid to the courier, "Pay PHP 25.00" |
| 4 | PayMongo hosted payment (the user paid with the test card) | PASS; pay_pY2pGwj7BFLkLAgjccq6kP9J; redirect to /checkout/success |
| 5 | Webhook order | PASS; order C12C2C61, one order for the session, paid/unfulfilled, guest, snapshot M02-SHIRT-S × 1 = 25.00 |
| 6 | Stock and cart | PASS; Small 8 → 7; guest cart empty |
| 7 | Confirmation email | PASS; sent 1.3 s after the order; the user confirmed one email received |
| 8 | Admin: order detail, mark Shipped (LBC, QA-M16-0001) | PASS; status, courier and tracking saved; one history row unfulfilled → shipped by the admin; shown after reload |

Test data kept: order C12C2C61 (shipped).

## M16-P01 soft launch (approved 2026-09-30)

No custom domain for now: production on https://atleteka.vercel.app, guest checkout only; Supabase Site URL and production redirect URL set by the user and verified. The webhook now acknowledges a permanent Resend refusal (logged, 200) instead of retrying forever; transient failures still retry. Test added (52 tests pass). See DECISIONS.md M16-P01.

Functional test (2026-09-30, M16 preview, the user paid with the test card as the signed-in admin, billing email rrai.creatives+admin@gmail.com, which the Resend test sender refuses): order 6D59A7B7 recorded once (paid, unfulfilled, account order, PHP 25.00, Small 7 → 6), confirmation_email_sent_at empty; function log `paymongo_webhook email_rejected <order> 403`; response 200; no PayMongo retries (only one delivery for the event). PASS. Side effect: the test address was saved to the admin account.

## Production Vercel variables (2026-09-30)

Removed from Production: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SENTRY_DSN. Set (values from .env.local, never printed): NEXT_PUBLIC_APP_URL=https://atleteka.vercel.app, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SENTRY_DSN, EMAIL_FROM (Resend test sender per M16-P01), SUPABASE_SERVICE_ROLE_KEY and RESEND_API_KEY (sensitive). Still missing, entered by the user: PAYMONGO_SECRET_KEY (live) and PAYMONGO_WEBHOOK_SECRET (live webhook). Done via a user-added permission rule in the outer folder's .claude/settings.local.json.

## Merge and production deploy (2026-09-30 to 2026-10-02)

- PRs #2 to #10 merged into main in order (merge commits, branches kept); main e7e5e9f is identical to feat/m16-qa-launch. Production https://atleteka.vercel.app deployed from it.
- Production smoke test: pages 200, missing product/category 404, /account redirects to /login, security headers present, canonical URLs on atleteka.vercel.app. The webhook answers 500 not_configured until the live PAYMONGO_WEBHOOK_SECRET is set (expected).
- Latency: functions ran in iad1 (US East) while Supabase is in ap-southeast-1, so warm catalog pages took 1.2-2.9 s. The dashboard region change did not save, so vercel.json now pins functions to sin1 (Singapore).

## Design refresh (2026-10-02, branch feat/design-warm-lifestyle)

Approved direction D-DESIGN-01 (DECISIONS.md). Implemented: theme tokens and fonts, buttons/inputs/cards, header (category navigation) and footer, home (hero, category tiles, product grid, trust notes), catalog listing, product page (option pills), cart, checkout, payment submitted, auth card, catalog and root not-found pages. Local production build checks: no horizontal overflow at 320 px on home, shop, cart, checkout, login and product; one visible h1 and one main per page; no unlabeled controls. Known, pre-existing: the missing-product 404 renders its message client-side (server HTML body empty; status 404 is correct).

## Studio design and demo catalog (2026-10-02, branch feat/design-studio-minimal)

D-DESIGN-02 (DECISIONS.md) replaces the warm design. Demo catalog seeded on the hosted database with `node --env-file=.env.local scripts/demo-catalog/seed.mjs` after `node scripts/demo-catalog/generate-images.mjs` (images in ignored .verification/demo-catalog): 6 categories, 14 products, 62 variants with stock (some sizes sold out; the bucket hat is fully sold out), 28 images. Checks: lint, typecheck, 53 tests, build; local production server shows distinct cover photos (Women: Cropped Denim Jacket, Men: Relaxed Chino), sizes XS → XL, desktop navigation without overlap.

## Demo checkout on production (2026-10-02)

Production runs in PayMongo test mode for presentations (DECISIONS.md "Demo checkout on production"). Verified end to end in the user's Chrome: option pills select a size and enable Add to cart; cart remove and quantity update work; checkout quote PHP 3,870.00; PayMongo test card payment; webhook order F19705A8 (guest, paid, one order for the session), stock Utility Overshirt XL 2 → 1 and Heavyweight Crew Tee M 14 → 12, confirmation email sent. Demo test card 4343 4343 4343 4345, any future expiry, any CVC. Before launch: live PAYMONGO_SECRET_KEY, live webhook and its PAYMONGO_WEBHOOK_SECRET in Production.

## Navy and crimson palette (2026-10-02, branch feat/design-navy-crimson)

D-DESIGN-03 recolors the Studio design with the user's palette (tokens in app/globals.css).

## Landing-style home page (2026-10-02, branch feat/home-landing)

D-DESIGN-04, plus the scrollable featured hero: verified on the branch preview in Chrome (slide 1 Cropped Denim Jacket on ink; Next moves the track exactly one slide and the counter reads 2 of 5; only the active slide is exposed to assistive technology; next-piece thumbnail visible). Re-running the seed reset demo stock to the catalog values. Earlier local production check: section order hero, brand statement, collection, spotlight (Oxford Button-Down), categories, Why Atleteka, How it works, FAQ (5), closing CTA (Shop women / Shop men); one h1; no horizontal overflow; apricot focus rings on the dark bands.

## M16 CHECKPOINT

- Completed: automated checks, not-found fix, SEO basics, responsive/accessibility/performance sanity, E2E critical path on the M16 preview.
- Remaining (needs the user): the deferred M03 reset check; launch checklist (live PayMongo key and webhook secret in Production, live PayMongo webhook, PayMongo business name, merge PRs #2-#9 and M16 in order, rotate the database password); then close M03 and M07-M16 in the PRD.

---

# Previous milestone record: M15 - Security & abuse review

Updated: 2026-09-30. Status: **In Progress**. The review is complete and two fixes are deployed to the M15 preview. **The M03 password-reset check is deferred to M16** (blocked by the Supabase email rate limit; see "M15 CHECKPOINT").

Branch feat/m15-security-review (a37ba0c Referrer-Policy fix, 7e7ffa2 anti-framing headers, plus the docs commit), stacked on feat/m14-observability. PR opened against feat/m14-observability (see HANDOFF.md). Preview: https://atleteka-git-feat-m15-security-review-rr-4c7a.vercel.app (branch-scoped Preview variables set, including Resend and Sentry).

## Review results (2026-09-28/30)

| Area | Result |
| --- | --- |
| RLS on every table; anon/authenticated table and column grants; security definer functions (empty search_path, expected execute grants); storage policies | PASS; no gaps |
| Anonymous access to orders, addresses, profiles, discounts, inventory, webhook_events | Denied. Guest cart_items without the cart cookie: 0 rows. Creating a paid order or calling record_paid_checkout: denied |
| T-007 price tampering | PASS; quote and charge come from database prices (server re-quote; the Pay button amount is compared, never charged) |
| T-008 quantity -5, T-014 above stock, T-013 inactive option | PASS; rejected by mutate_cart |
| T-009 another user's order | PASS; 0 rows and "Order not found" |
| T-010 customer admin writes (stock, price, order status, order items, coupon counter) | PASS; 0 rows or denied |
| T-011 expired coupon, T-012 coupon at limit, wrong letter case | PASS; rejected (P7003) |
| T-015 role escalation; address filed under or moved to another user | PASS; denied |
| T-016 upload type and size | PASS (verified in M11) |
| Server secrets in browser bundles | PASS; actual values of the service key, PayMongo keys, webhook secret, Resend key and Vercel token are absent; only the public Sentry DSN appears; the only "whsk_" match is the scrubber's own regex |
| Webhook abuse (M14 preview) | PASS. Unsigned, wrong secret, tampered body, stale, live slot on a test deployment: 401. Signed with livemode true or another type: 200 ignored. Replay: 200 duplicate. Nonexistent session: 500, nothing recorded. Malformed JSON: 400 |
| Error messages and logs | PASS by design; only HTTP status codes are interpolated; webhook logs carry ids and codes only |
| Fix 1: Referrer-Policy same-origin | Verified; a native (pre-hydration) form post reaches the Server Action instead of the CSRF abort and HTTP 500 |
| Fix 2: anti-framing and nosniff headers | Verified in the preview response headers |
| Auth redirect allowlist (found 2026-09-30 during the M03 reset attempt) | The reset email sent the user to localhost: the preview URL was not in Supabase Auth Redirect URLs, so Supabase fell back to the Site URL. The user added `https://atleteka-git-*-rr-4c7a.vercel.app/**` in the dashboard. Verified: /auth/v1/verify with an invalid token now 303-redirects to the M15 preview /login with otp_expired. Site URL left unchanged (still local) |
| M03 password reset end to end | DEFERRED to M16. Two reset emails were used (the first went to localhost); the built-in mailer's limit (about 2/hour) then stopped delivery |

Recommendations (not implemented): full Content-Security-Policy; enable Supabase leaked-password protection (Auth setting, advisor WARN); use long random coupon codes (quote attempts are not rate limited); set the PayMongo business name to "Atleteka".

## M15 CHECKPOINT

- Completed: full review, two fixes deployed, PRD 14_DECISION_LOG row 13 (M15-P01, Approved 2026-09-30), M15 In Progress in 07_ROADMAP.
- M03 reset check deferred to M16 (user decision 2026-09-30, email rate limit). Procedure when retried: on a device the user controls (not the company laptop), open /login?mode=recover on a preview, request ONE reset for rrai.creatives+customer@gmail.com, long-press the email link, copy it, and paste it into the same browser (the PKCE verifier cookie lives there); expect /login?mode=reset, set a new password, land on /account. Fallback: the user sends only the pkce_ token; Claude calls /auth/v1/verify with curl --max-redirs 0 and gives back the ?code= URL for that same browser. Claude in Chrome was not reachable this session.
- M15-P01 **Approved** by the user on 2026-09-30 (DECISIONS.md; PRD 14_DECISION_LOG row 13 F13/G13/D13).
- Exact next action: M16.
- Then M16 (QA & launch): the single final QA pass (DECISIONS.md "Testing cadence"): lint, typecheck, build, full test suite, mobile/responsive, UI consistency, core-path regression, the not-found HTTP status, and closing M03 and M07-M15 in the PRD. Pre-launch: verified Resend domain and EMAIL_FROM; Production Vercel variable cleanup (remove STRIPE_* and placeholders; add live values and NEXT_PUBLIC_SENTRY_DSN); live PayMongo key and live webhook; merge PRs #2-#8 and M15 in order; rotate the database password pasted in an early session; set the Supabase Auth Site URL to the production domain and add the production redirect URL (then consider removing the preview wildcard); retry the deferred M03 reset check.

---

# Previous milestone record: M14 - Observability & analytics

Updated: 2026-09-28. Status: **In Progress**: functional acceptance passed; held, like M07–M13, only for the deferred M03 check and the final QA pass.

M14-P01 (DECISIONS.md, PRD 14_DECISION_LOG row 12): Sentry errors only with scrubbing; Vercel Web Analytics.

## Implemented behavior

- @sentry/nextjs 11.0.0 and @vercel/analytics 2.0.1 (exact versions, 0 audit findings).
- instrumentation.ts loads sentry.server.config.ts / sentry.edge.config.ts and exports onRequestError, which captures and then awaits Sentry.flush(2000). Without the await, Vercel froze the function before the upload (found in testing). instrumentation-client.ts initializes the browser SDK and exports onRouterTransitionStart.
- lib/monitoring/sentry-options.ts (shared): DSN from NEXT_PUBLIC_SENTRY_DSN (monitoring off when unset), sendDefaultPii false, tracesSampleRate 0, no replay/feedback integrations, beforeSend/beforeBreadcrumb → lib/monitoring/scrub.ts (drops request cookies/headers/body/query/env and user; masks emails, PayMongo sk_/pk_, Resend re_, whsk_, Supabase sb_ keys, JWTs, provider ids). Optional debug logging only with SENTRY_DEBUG=1.
- app/error.tsx, app/checkout/error.tsx and the new app/global-error.tsx report caught render errors.
- next.config.ts wraps withSentryConfig({ silent, telemetry: false, sourcemaps: { disable: true } }): nothing is uploaded at build time.
- <Analytics /> in app/layout.tsx; Web Analytics enabled by the user in the Vercel project.
- .env.example: NEXT_PUBLIC_SENTRY_DSN (replaces SENTRY_DSN); PRD 10_ENV row 12 updated.

## Functional verification (2026-09-28, Vercel preview, admin via Claude in Chrome)

| # | Check | Result |
| --- | --- | --- |
| — | tests/scrub.test.mjs | emails, keys, JWTs, provider ids masked; request/user data dropped |
| 1 | Browser error (temporary admin button, message with a fake email and re_ key) | PASS; Sentry issue "M14 test browser error for [email] with key [resend-key]" |
| 2 | Server Action error (fake email and sk_test_ key) | PASS after fix 71637ad (await flush): "M14 test server error for [email] with key [paymongo-key]", Unhandled, POST /admin, 0 users |
| 3 | Vercel Web Analytics | PASS; first-party analytics script loads and its endpoint answers 200 |
| — | Cleanup | temporary buttons and action removed; SENTRY_DEBUG removed from the preview |

Finding recorded for M15 (DECISIONS.md): Vercel's own function log prints unhandled server error messages unscrubbed.

## M14 CHECKPOINT

- Completed: M14-P01, Sentry and analytics, scrubbing, flush fix, functional tests, cleanup.
- Exact next action: M15 (security & abuse review: RLS, price tampering, role abuse, upload validation, webhook replay).
- Remaining: the deferred M03 check, the pre-hydration 500 fix, the not-found status code, the Vercel-log finding, the final QA pass, Resend domain, Sentry DSN and Production Vercel variable cleanup before launch.

---

# Previous milestone record: M13 - Transactional email

Updated: 2026-09-28. Status: **In Progress**: functional acceptance passed; held, like M07–M12, only for the deferred M03 check and the final QA pass.

M13-P01 (DECISIONS.md, PRD 14_DECISION_LOG row 11): one confirmation per paid order via Resend; orders.confirmation_email_sent_at plus Resend Idempotency-Key = order id; on failure the order is untouched, the error is logged and the webhook returns 500 so PayMongo retries the email; EMAIL_FROM sender variable.

## Implemented behavior

- Migration 20260928082612_order_confirmation_email.sql adds orders.confirmation_email_sent_at (written only by the service-role webhook).
- app/api/paymongo/webhook/route.ts: after record_paid_checkout (new order or duplicate), lib/email/confirmation.ts loads the order with the service client and, while confirmation_email_sent_at is empty, sends via lib/email/resend.ts (POST https://api.resend.com/emails, Bearer RESEND_API_KEY, Idempotency-Key order-confirmation-<order id>, 15 s timeout; response bodies not logged), then stamps the time only if still empty. Failures log "paymongo_webhook email_failed <order id> <HTTP status>" and return 500.
- lib/email/order-confirmation.ts builds subject, HTML (all customer-entered text escaped) and plain text: order number, items with SKU, subtotal, discount, amount paid (tax included), shipping paid to the courier on delivery, delivery address, and an order link for account orders.
- .env.example and PRD 10_ENV row 14 list EMAIL_FROM. Local and preview use Atleteka <onboarding@resend.dev>; the Resend key is a sending-only key.
- The PayMongo test webhook hook_e5HJPTAUgtKmM1aEQBx28Lz2 now points to https://atleteka-git-feat-m13-order-email-rr-4c7a.vercel.app/api/paymongo/webhook (user-approved). Branch-scoped Preview variables for feat/m13-order-email include RESEND_API_KEY and EMAIL_FROM.

## Functional verification (2026-09-28, Vercel preview, PayMongo test mode)

| # | Check | Result |
| --- | --- | --- |
| 1 | Guest pays with the Resend account's address | PASS; order E789E1B4 recorded, confirmation accepted 0.5 s later, exactly one email received with correct content |
| 2 | Signed replay of the same event; new event id for the same session | PASS; both 200 duplicate; confirmation_email_sent_at unchanged; still one email |
| 3 | Recipient Resend refuses (test sender, non-owner address) | PASS; order 2C00FDCC intact, "email_failed <order> 403" logged, webhook returned 500 and PayMongo retried; email stays unsent for that test order |
| — | tests/email.test.mjs | content, HTML escaping, guest variant |

Before launch: verify an own sending domain in Resend and set EMAIL_FROM to it (the test sender only delivers to the account owner).

## M13 CHECKPOINT

- Completed: M13-P01, migration, email sending in the webhook, functional tests; PRD decision log rows 8–11 (M09–M13-P01) and the EMAIL_FROM env row.
- Exact next action: M14 (observability & analytics: Sentry, basic analytics).
- Remaining: the deferred M03 check, the pre-hydration 500 fix, the not-found status code, the final QA pass, Resend domain, and Production Vercel variable cleanup before launch.

---

# Previous milestone record: M12 - Admin orders

Updated: 2026-09-28. Status: **In Progress**: functional acceptance passed; held, like M07–M11, only for the deferred M03 check and the final QA pass.

M12-P01 (DECISIONS.md): statuses needs_review "Under review", unfulfilled "To ship", shipped, delivered, cancelled; steps needs_review → unfulfilled | cancelled, unfulfilled → shipped | cancelled, shipped → delivered; courier and tracking number when shipping; order_status_history audit; cancelling never changes payment state.

## Implemented behavior

- Migrations 20260928081020_order_fulfillment.sql and 20260928081056_order_status_private.sql: status values; orders.courier, tracking_number, status_updated_at, status_updated_by; order_status_history (RLS, admin read only; no client writes); private.admin_update_order_status (security definer, empty search_path) behind a public SQL-standard security invoker wrapper, following the checkout_quote pattern so no definer function is exposed. It requires an admin caller, locks the order, enforces the allowed step, trims courier/tracking (only allowed when shipping), updates only status/courier/tracking/audit fields and writes history. Admins still have no UPDATE grant on orders; payment_status and amounts are unreachable.
- /admin/orders (lib/admin/orders.ts): all orders newest first with date, short id, email (guest marked), item count, total, status; filter by status. /admin/orders/[id]: items with SKU, totals, customer and delivery address, PayMongo payment/session references, payment status (set only by the webhook), the needs_review explanation, a form offering only the allowed next statuses (courier/tracking fields when Shipped, a refund warning when Cancelled; the form remounts on status change), and the status history.
- lib/orders/status.ts holds the shared statuses, labels and steps. Customer pages (/account/orders, /order/[id]) accept all statuses, label unfulfilled as "Processing", show courier/tracking once shipped, and explain cancellation.
- Security advisor: after the private-wrapper migration only the long-standing webhook_events INFO and leaked-password WARN remain.

## Functional verification (2026-09-28)

| # | Check | Result |
| --- | --- | --- |
| — | Rolled-back dry run: allowed/refused steps, courier on non-ship step, unknown order, customer call, admin direct payment edit, history visibility | PASS |
| — | Customer through the public wrapper after the private move | PASS; denied |
| 1 | /admin/orders list and status filters (Vercel preview, admin via Claude in Chrome) | PASS; 3 orders newest first; filters 1 / 2 / empty-state |
| 2 | Under review → To ship → Shipped (" LBC Express ", LBC-TEST-12345) → Delivered | PASS; only allowed options at each step; courier trimmed; final state message; payment stayed Paid; 3 history entries |
| 3 | To ship → Cancelled (guest order) | PASS; refund warning shown, no courier fields, final, payment Paid |
| 4 | Stale second tab tries Cancelled after the order was Shipped | PASS; refused by the database ("not allowed from the order's current status") |
| 5 | Final data and customer visibility (rolled-back check) | PASS; statuses and payments as expected; 5 history rows all by the admin; customer sees own orders with courier/tracking, no history, not the guest order |

Test data now: guest order cancelled; coupon order shipped (no courier); flagged order delivered (LBC Express / LBC-TEST-12345).

## M12 CHECKPOINT

- Completed: M12-P01, migrations, admin order pages and action, customer status display, functional tests.
- Exact next action: M13 (transactional email: order confirmation via Resend).
- Remaining: the deferred M03 check, the pre-hydration 500 fix, the not-found status code, the final QA pass, and Production Vercel variable cleanup before launch.

---

# Previous milestone record: M11 - Admin products/categories/inventory

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
