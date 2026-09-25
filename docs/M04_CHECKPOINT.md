# Current milestone: M04 - Catalog

## Status and authorization

Complete and verified within M04 catalog scope. User explicitly authorized M04; stop before M05. M01 and M02 (the PRD dependencies) are verified. M03 remains partially verified with an unresolved browser Server Actions failure; see [M03 checkpoint](M03_CHECKPOINT.md). Advancing does not mark M03 complete.

Source: PRD.xlsx 07_ROADMAP!A8:I8, 02_SCOPE rows 4-6, 04_ROUTES rows 5-7, US-001/US-002, 09_COMPONENTS, 06_RLS_AUTH and T-013/T-017/T-018. Workbook unchanged.
User confirmed **PHP** as the single catalog currency on 2026-09-17.

## Acceptance criteria

- PASS: Active catalog renders from the database, with image/name/PHP price/availability.
- PASS: Invalid or inactive product/category routes return not-found/unavailable handling.
- PASS: Valid variant selection updates price/availability; sold-out variants cannot be added.
- PASS: Responsive, keyboard-accessible mobile/desktop pages with loading, empty and recoverable error states.

M04 delivers /shop, /categories/[slug], /products/[slug], product images/gallery, variants and availability. Public browsing requires no account.

## Inspection and concise implementation plan

Existing M01 primitives and layout are reusable. M02 stores variant prices and stock; M03 RLS permits active catalog reads but intentionally hides exact inventory. At initial inspection, the hosted seed had two active products, one inactive product, five variants, one category and no image rows/buckets. Do not invent product photographs or expose inventory counts.

| Change | Files/modules | Why / impact | Verification |
| --- | --- | --- | --- |
| Public catalog reads and validation | lib/catalog/*, lib/supabase/public.ts | Anonymous server client, explicit active filters, Zod URL/DB/media validation, bounded server pagination and PHP formatting. No env names or dependencies added. Never reuse admin privileges for storefront reads. | Query/validation tests, pagination, inactive/invalid slugs, no stock counts/secret exposure. |
| Derived availability and media bucket | One Supabase migration; SQL tests | Read-only availability projection over existing variants/inventory; restricted private helper exposes only active-variant in-stock boolean. RLS remains enforced; inventory writes/counts remain private. Public product-images bucket for catalog media; no application upload/write policy or upload flow. No business table/field added. | Clean replay, public/customer/admin boundary tests, inactive variants and stock zero/missing, no public writes, hosted advisors. |
| Catalog pages and reusable components | app/(catalog)/shop, categories/[slug], products/[slug]; components/catalog/* | Server product cards/listings and small interactive gallery/variant islands. Reuse Container/Card/Button/Label. Add shop navigation using the existing header/home. | DB-backed navigation, variant price/stock changes, image/fallback, keyboard/mobile/desktop. |
| State handling and verification docs | Catalog loading/error/not-found, tests, docs/README | Visible loading/empty/error/unavailable states without exposing internals. Record exact results and remaining limitations. | Lint, typecheck, Node tests, browser checks, build, migration tests and baseline diff. |

Plan stays inside the PRD and approved architecture. No new package, service, environment variable, business entity or route beyond the three approved catalog routes.

## Scope boundaries

No M05 search/filter controls or /search route. Category pages are M04 browsing, not M05 filtering. No cart route, quantity selector, cart persistence/mutation, checkout/payment, admin CRUD or uploads. Variant selection is display only; server authority is preserved for later mutations. A sold-out product may show a disabled purchase control; M04 does not implement a working add-to-cart action. No reviews, recommendations or compare-at pricing absent from the current model.

## Verification results

All M04 acceptance criteria are verified. The following implementation checks passed before closeout; no application code changed during the final cleanup continuation.

| Check | Result / evidence |
| --- | --- |
| Lint | PASS: npm run lint, zero warnings, exit 0 after the final error-recovery fix. |
| TypeScript | PASS: npm run typecheck, exit 0 after the final fix. |
| Automated tests | PASS: 12 Node tests (6 auth regression, 6 catalog validation/presentation). |
| Production build | PASS: npm run build, exit 0; only the three approved catalog routes added. |
| Migration replay | PASS: two clean PostgreSQL 17 replays with identical schemas; historical M02 tests at the M02 stage, then M03/M04 SQL tests. Local platform Auth/Storage stubs were supplemented by hosted checks. |
| Hosted SQL/API | PASS: active-only boolean availability, immediate stock changes, zero/missing stock unavailable; exact stock reads, availability writes and anonymous uploads denied. |
| Browser | PASS: 17 checks covering shop/category pagination, invalid/inactive/out-of-range URLs, variant price/stock changes, galleries/fallbacks, no-variant state, keyboard selection, loading and outage/retry. |
| Responsive | PASS: 1440, 768, 390 and 320px; no horizontal overflow. Screenshots inspected. |
| Advisors | No WARN/ERROR. Informational notices only: intentionally service-only webhook table and unused indexes in the early dataset. |
| Cleanup | PASS: all 13 temporary products, 3 variants, 3 categories, their images/joins/stock removed. Original 3 products, 5 variants, 1 category and stock quantities preserved. No test users or media objects remain. |

Evidence is retained locally under .verification: m04-browser-results.json, m04-api-results.json, m04-local-tests.log, m04-schema-a.sql, m04-schema-b.sql, m04-product-*.png, m04-scope.diff, m04-files.json and m04-closeout.json.

## Database / environment / dependencies

Applied migration: 20260916191213_catalog_availability_and_media.sql. Its local SQL MD5 matches hosted history: d857807e91f3a49344ebb68d3d64b087.

Changes: security-invoker product_availability view, restricted private.variant_in_stock helper and public product-images bucket. No business table or field added. No storage-write policy or upload workflow added.

Environment changes: None for M04. Dependency changes: None; package.json and package-lock.json are byte-identical to the pre-M04 baseline.

## Files and scope audit

Created:
- app/(catalog)/shop/page.tsx, categories/[slug]/page.tsx, products/[slug]/page.tsx, loading.tsx, error.tsx and not-found.tsx.
- components/catalog/catalog-listing.tsx, product-grid.tsx, product-gallery.tsx, product-image.tsx and variant-selector.tsx.
- lib/catalog/data.ts, lib/catalog/validation.ts and lib/supabase/public.ts.
- supabase/migrations/20260916191213_catalog_availability_and_media.sql, supabase/tests/m04_catalog.sql and tests/catalog.test.mjs.
- docs/M03_CHECKPOINT.md to preserve the incomplete earlier milestone accurately.

Modified: app/page.tsx, components/layout/site-header.tsx, AGENTS.md, README.md, supabase/README.md and docs/ARCHITECTURE.md, CURRENT.md, DATABASE.md, DECISIONS.md, ROADMAP.md, SECURITY.md. No files deleted.

The refreshed Git no-index diff against .verification/m04-baseline was reviewed because this repository has no committed baseline. Changes are confined to the M04 catalog and its documentation/tests. Existing primitives are reused. Client Components serve gallery/variant/image-error/retry interaction. No unsafe TypeScript shortcuts, unnecessary client mutations, new dependencies, exposed privileged keys or M05 functionality were found. Existing Auth files remain unchanged by M04.

PRD.xlsx SHA256 remains d6d45532e4789a9fad58c94af885932e308812fd9dc01cfa18f6b0e809b1e74b. Workbook statuses remain historical; this document records execution status.

## Known limits and issues

- M03 browser login remains unresolved, and confirmation/recovery emails remain unverified. See M03_CHECKPOINT.md. M04 signoff is limited to public catalog behavior, not authentication or launch readiness.
- No merchant photos were supplied. Gallery behavior used real temporary database image rows with controlled browser image responses; production asset delivery with merchant photos was not exercised. Missing/broken media fallback passed.
- Add to cart remains disabled; cart mutations belong to M06. Search/filter functionality belongs to M05 and is unstarted.
- Full Docker Supabase startup was not run; local PostgreSQL replay and actual hosted Supabase checks passed.
- The previous local dev server is no longer reachable. Earlier production browser evidence is retained; use npm run dev to reopen the app.

PRD deviations: None. PHP is an explicit user-approved clarification, recorded in DECISIONS.md.

## Checkpoint

Completed: M04 implementation, all required verification, fixture cleanup, final scope audit and status documentation.
Current position: M04 complete and verified within its catalog scope.
Next thing to do: wait for the user's next instruction.
Remaining: no M04 work. M03's separate auth follow-up remains unresolved. M05 has not started.
