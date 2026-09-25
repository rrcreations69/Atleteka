# Current milestone: M05 - Search & filters

## Status and authorization

Complete and verified within M05 scope on 2026-09-21. The user explicitly authorized M05 after verified M04. Stop before M06.

M04 evidence is preserved in [M04_CHECKPOINT.md](M04_CHECKPOINT.md). M03 authentication verification remains incomplete in [M03_CHECKPOINT.md](M03_CHECKPOINT.md); this public catalog signoff does not resolve it or establish launch readiness.

## PRD and acceptance results

Read directly: PRD.xlsx 07_ROADMAP!A9:I9, 02_SCOPE!A7:E8, 04_ROUTES rows 5-8, architecture/data/RLS constraints, T-013/T-017/T-018 and AI guardrails.

Objective: basic search/category/availability filtering (P1), dependent on M04.
Roadmap acceptance: URL/state predictable; no overbuilt search service.

| Acceptance criterion | Result | Evidence |
| --- | --- | --- |
| Basic product search | PASS | Live Supabase and browser tests: case-insensitive literal name substring, blank/default behavior, punctuation and no-match results; inactive products excluded. |
| Category and availability filters | PASS | Each works independently and combined with search. Active category scope is enforced. In-stock means at least one active variant with positive current stock; zero/missing stock and inactive variants do not qualify. |
| Predictable URL/state | PASS | GET forms, q/category/availability/page serialization, copied/reloaded URLs, browser back/forward, criteria preserved through pagination/category links, page reset on changes, clear action. Multi-batch fixture test returns all 15 matches across pages of 12 and 3. |
| States, responsive and accessibility | PASS | Loading, empty/no-match, recoverable outage/retry, malformed/duplicate input, hidden/nonexistent categories and out-of-range pages. Keyboard-only form flow and labels. No horizontal overflow at 1440/768/390/320px; desktop/mobile screenshots inspected. |
| Approved architecture and security | PASS | Anonymous Server Component queries plus unchanged RLS, Zod URL/DB validation, literal pattern escaping, no raw stock or public writes. No new client component, search service, dependency or future-milestone behavior. |

Optional price-range filtering is omitted. No sorting/ranking, autocomplete, faceted-search infrastructure, cart mutations or M06 preparation was added.

## Implementation plan and delivered files

The plan was recorded before application changes. Validation helpers were kept in the existing validation module to avoid another small module.

| Change | Files/modules | Database / environment | Security / verification |
| --- | --- | --- | --- |
| URL validation and serialization | lib/catalog/validation.ts; tests/catalog-search.test.mjs | None | Bound literal search, reject invalid/duplicate known parameters, safely encode links; four new tests. |
| Basic queries | lib/catalog/data.ts | Existing schema only; no environment changes | Name/category filtering in Supabase; existing derived availability checked before pagination, anonymous active-only reads; live API/browser tests. |
| Controls and results | New catalog-filters.tsx and /search page; existing shop/category/listing/grid/header | None | Server-rendered GET forms, reuse Input/Label/Button/grid/loading/error/not-found; browser state, keyboard and responsive checks. |
| Documentation | AGENTS, README, CURRENT, ROADMAP, ARCHITECTURE; preserved M04 checkpoint | None | Scope audit and durable milestone evidence. |

Search is a trimmed literal product-name substring, maximum 100 characters. Category is an active category slug. Availability accepts all or in-stock. Page is a bounded positive integer. Empty defaults are accepted; duplicate known parameters fail validation. Unknown parameters confer no authority and are ignored. Category path scope is authoritative; contradictory category parameters are rejected.

PostgREST imatch is used with all regex metacharacters escaped, so text such as [.*] or 100%_ is literal. Verified against the [PostgREST filtering reference](https://docs.postgrest.org/en/stable/references/api/tables_views.html) and the live database.

The existing availability view has no PostgREST relationship to products. In-stock requests scan matching products in batches of 100, read existing boolean availability in bounded ID batches, count qualifying products and retain only the requested page. Ordinary name/category requests use database pagination. Stable name/id ordering is preserved. No schema/RPC/index/entity is introduced.

## Files

Created (4):
- app/(catalog)/search/page.tsx
- components/catalog/catalog-filters.tsx
- tests/catalog-search.test.mjs
- docs/M04_CHECKPOINT.md

Modified (12):
- app/(catalog)/shop/page.tsx
- app/(catalog)/categories/[slug]/page.tsx
- components/catalog/catalog-listing.tsx
- components/catalog/product-grid.tsx
- components/layout/site-header.tsx
- lib/catalog/data.ts
- lib/catalog/validation.ts
- AGENTS.md
- README.md
- docs/CURRENT.md
- docs/ROADMAP.md
- docs/ARCHITECTURE.md

Deleted: None.
Migrations/schema changes: None.
Environment variables added/changed: None.
Packages added/removed: None.

## Verification results

- PASS: npm run lint, zero warnings, exit 0 after the final code change.
- PASS: npm run typecheck, exit 0. An initial Zod input-type mismatch was fixed.
- PASS: npm test, all 16 tests (four M05 plus 12 existing regressions). Node reports its existing module-format warning when loading TypeScript tests; no test failure.
- PASS: npm run build, exit 0. Only the approved /search route was added.
- PASS: live Supabase API checks for literal case-insensitive search and injection-shaped text, inactive product/category denial, raw stock denial, read-only boolean availability.
- PASS: 19 production-browser checks; no unexpected page errors. Includes 105 matching fixture products across query batches, 15 in-stock matches, combined category subset, keyboard operation, outage/retry, and all four viewport widths.
- PASS: fixture cleanup verified. Original 3 products, 5 variants, 1 category and all original stock counts preserved. All 107 temporary products, 108 variants, 4 categories and associated test rows removed.
- PASS: Git no-index diff reviewed against the saved pre-M05 baseline (repository has no committed baseline). No future-milestone code, unrelated refactor, duplicated UI, dead code, new client component, TypeScript suppression/any or exposed privileged keys found. Package/lockfile, .env.example, Auth and migration files are unchanged.
- No migration replay was necessary because no schema or migration changed. No full Docker Supabase startup was performed.

Evidence under ignored .verification: m05-*-results.json, m05-lint.log, m05-typecheck.log, m05-test.log, m05-build.log, m05-browser.log, m05-search-*.png, m05-files.json, m05-scope.diff and m05-closeout.json. Test-only outage injection was removed from the local running server after verification.

PRD.xlsx remains unchanged: SHA256 d6d45532e4789a9fad58c94af885932e308812fd9dc01cfa18f6b0e809b1e74b. Historical workbook statuses remain unchanged.

## Known issues and limitations

- M03 browser-auth verification remains unresolved separately.
- In-stock filtering performs a linear scan of products matching name/category; its read cost grows with that result set. Verification covered multiple batches, not production-scale load. This preserves the approved schema and keeps the basic implementation small.
- Merchant photos remain absent from the development seed; existing image fallbacks remain in use.

PRD deviations: None.
Proposed PRD changes: None.

## Checkpoint

Completed: M05 implementation, lint/typecheck/tests/build, live API/RLS and browser checks, fixture cleanup and final scope audit.
Current position: M05 complete and verified.
Next thing to do: wait for the user's instruction.
Remaining: no M05 work; M03's separate authentication issue remains unresolved. M06 has not started.
