# Implementation roadmap

Derived from PRD.xlsx 07_ROADMAP!A3:I20. Read 08_USER_STORIES and 11_TEST_MATRIX for behavioral and launch gates. Follow workbook order, one milestone at a time, even where dependencies would permit parallel work.

## Current state

Updated 2026-10-05. **The project is in M16 (QA & launch), the last milestone.** Every feature milestone (M00-M15) is built, tested end to end and live on https://atleteka.vercel.app in demo mode (PayMongo test keys; see CURRENT.md "START HERE"). The final QA pass and end-to-end critical path passed on 2026-09-30, production has run `main` since 2026-10-02 (M16-P01 soft launch), and every page was redesigned in the Studio style on 2026-10-05 (#13-#24).

What still stands between demo mode and a real launch (all need the user):
1. Real products and photos (the 14 demo products are placeholders).
2. Live PayMongo key, live webhook and its secret in Vercel Production.
3. A verified Resend domain and EMAIL_FROM (confirmations currently reach one test address).
4. Rotate the database password; enable Supabase leaked-password protection.
5. The deferred M03 password-reset check (the only reason M03, and M07 through its dependency, stay open).
6. Then close M03 and M07-M16 in PRD.xlsx and here.

History before 2026-10-05: M00-M02, M04-M06 verified per their checkpoints; M03 implemented with one browser/email check deferred; M07-P01, M08-P01 (PayMongo replaces Stripe), M09-P01, M11-P01, M12-P01, M13-P01 and M14-P01 approved; M15 review done with two fixes deployed.

The "Workbook status" column mirrors PRD.xlsx 07_ROADMAP exactly; it was last changed by the user-authorized 2026-09-25 status correction and still lists M16 as Not Started. The "Actual status" column is the verified state on 2026-10-05.

| ID | Milestone | Priority | Dependency | Workbook status | Actual status (2026-10-05) | Deliverables | Definition of Done / Acceptance Criteria | Owner | Estimate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M00 | Repository & engineering baseline | P0 | None | Done | Done | Next.js TS app; Tailwind; shadcn; lint/typecheck; env example; AGENTS.md/AI rules | App runs locally; lint/typecheck pass; secrets excluded; conventions documented. | Eng | S |
| M01 | Design system & shell | P0 | M00 | Done | Done | Typography, spacing, header/footer, buttons/cards/forms, responsive container | Consistent layout on mobile/desktop; reusable primitives; no feature business logic yet. | Frontend | S |
| M02 | Supabase & schema | P0 | M00 | Done | Done | Supabase project config, migrations, data model, seed script | Schema matches PRD; migrations reproducible; seed creates usable catalog data. | Backend | M |
| M03 | Authentication & authorization | P0 | M02 | In Progress | Built and live; deferred password-reset email check open | Login/register/session, profiles, customer/admin roles, RLS | Customer/admin access tests pass; privilege escalation blocked. | Backend | M |
| M04 | Catalog | P0 | M01,M02 | Done | Done | Shop, category, product detail, images, variants, availability | Active catalog renders from DB; invalid/inactive routes handled; responsive. | Full Stack | M |
| M05 | Search & filters | P1 | M04 | Done | Done | Basic search/category/availability filtering | URL/state predictable; no overbuilt search service. | Full Stack | S |
| M06 | Cart | P0 | M04 | Done | Done | Add/update/remove, persistence, subtotal display, empty/error/loading states. Database/RLS, cookie, Server Actions, UI and guest/account browser flows verified on 2026-09-23. | Variant-aware; positive integer quantity within stock; current server prices/subtotal. Secure 30-day hashed guest identity; separate account carts, no merge. Complete only after end-to-end verification. | Full Stack | M |
| M07 | Checkout foundation | P0 | M03,M06 | In Progress | Built and live; open only for the M03 dependency | PH address/account reuse, authoritative PHP merchandise quote, discount validation; M03 dependency verification incomplete | Current prices/stock and single coupon validated server-side; tax included; shipping/final payable total pending; account addresses isolated. | Backend | M |
| M08 | PayMongo payment | P0 | M07 | In Progress | Built, tested end to end, live in demo mode | PayMongo hosted checkout session and safe metadata; merchandise-only charge (shipping paid to courier on delivery) | Client cannot choose price/total; test payment can complete. | Backend | M |
| M09 | Webhook & order creation | P0 | M08 | In Progress | Built, tested end to end, live in demo mode | Signature verification, idempotency, order snapshots, payment state, inventory adjustment | Duplicate webhook safe; browser close after pay still produces correct order; no double inventory deduction. | Backend | L |
| M10 | Customer account | P1 | M03,M09 | In Progress | Built, tested end to end, live in demo mode | Order history/detail, addresses, settings | Users only see own data; empty/loading/error states included. | Full Stack | M |
| M11 | Admin products/categories/inventory | P1 | M03,M04 | In Progress | Built, tested end to end, live in demo mode | Admin CRUD/archive and stock management | All mutations admin-only; images validated; no destructive accidental deletion. | Full Stack | L |
| M12 | Admin orders | P1 | M09 | In Progress | Built, tested end to end, live in demo mode | Order list/detail and fulfillment status updates | Payment status protected; fulfillment updates auditable enough for MVP. | Full Stack | M |
| M13 | Transactional email | P1 | M09 | In Progress | Built, tested end to end, live in demo mode | Order confirmation email | Sent once per paid order event; failure is logged without corrupting order. | Backend | S |
| M14 | Observability & analytics | P1 | M00 | In Progress | Built, tested end to end, live in demo mode | Sentry; basic analytics | Production errors visible; no secrets/PII leakage in logs. | Eng | S |
| M15 | Security & abuse review | P0 | M03-M14 | In Progress | Review done, fixes deployed; deferred M03 check open | RLS review, price tampering, role abuse, upload validation, webhook replay checks | Critical abuse cases in test matrix pass. | Security | M |
| M16 | QA & launch | P0 | M15 | Not Started | In progress: QA and E2E passed 2026-09-30, live since 2026-10-02, redesign 2026-10-05; launch items open | E2E critical path, performance/accessibility sanity, production env/deploy | Launch checklist complete; critical P0/P1 defects closed. | Team | M |

## Verified milestone history

- M00: exact locked baseline installed; local root returned HTTP 200; lint, strict typecheck and production build exited 0. shadcn configuration and cn merging verified. Desktop/mobile browser checks passed, with one main/h1, no overflow or runtime errors and expected unknown-route 404. Placeholder-only environment, Git secret exclusions and static-asset secret checks passed. Documentation records setup and conventions. No schema or services added. Original detailed evidence is also preserved locally in .verification/m01-baseline/docs/CURRENT.md.
- M01: typography/spacing, responsive shell and reusable buttons/cards/form fields implemented. Lint/typecheck/build passed; Chrome shell checks at 1440/768/390/320px and isolated actual-component checks passed. Keyboard, disabled/required/error states, contrast and screenshots verified. Scope audit confirms no feature business logic, dependency, environment or schema changes. Prior detailed M01 evidence is preserved locally in .verification/m02-baseline/docs/CURRENT.md.

- M02: 14-table schema, local configuration, two hosted migrations and repeatable development catalog seed. Clean PostgreSQL 17 replays produce identical schemas; SQL constraint/snapshot/RLS tests and hosted checks pass. Lint/typecheck/build pass. No application code, dependency, environment or PRD changes. See CURRENT.md for exact migration versions, evidence and limitations.

## Workflow

Read relevant requirements and inspect existing code. Restate acceptance criteria and dependencies. Plan expected files, schema, security, environment, tests, risks, and exclusions. Implement only the authorized milestone. Run lint, typecheck, and relevant tests. Verify every criterion individually and report evidence and limitations. Stop before the next milestone unless explicitly instructed.

A plan or created files alone do not establish completion. Required functionality, security/RLS/validation, applicable UI states and responsive/accessibility behavior must work. No known P0 issue may remain; M16 requires critical P0/P1 defects closed. If checks cannot run, document that limitation and leave affected criteria unverified.

## Dashboard and status preservation

15_DASHBOARD cached results after the 2026-09-25 status correction (workbook statuses only; they predate M08-M16 progress, see "Current state"): 17 total, 6 Done, 2 In Progress, 0 Blocked, 9 Not Started (35.29% complete). Formulas are unchanged and the workbook recalculates fully on load. Read milestone checkpoints for actual execution history. Native Excel recalculation was not exercised.

## User-story traceability

| ID | Persona | Story | Acceptance Criteria | Out of Scope / Notes | Priority | Milestone |
| --- | --- | --- | --- | --- | --- | --- |
| US-001 | Shopper | As a shopper, I can browse active products so I can discover items to buy | Only active products display; cards show image/name/price/availability; mobile/desktop usable; empty/error/loading states exist. | No recommendation engine. | P0 | M04 |
| US-002 | Shopper | As a shopper, I can view a product and choose a valid variant | Variant selection updates price/availability; sold-out state disables add-to-cart; invalid slug returns 404/not found. | No reviews. | P0 | M04 |
| US-003 | Shopper | As a shopper, I can add a variant to cart and edit quantities | Same variant increments/updates; nonpositive quantities rejected except explicit removal; cannot exceed current stock. Cart persists: 30-day secure guest cookie or separate account cart; no automatic merge. | Server derives current prices, line totals and subtotal; browser amounts have no authority. No reservation or stock deduction. | P0 | M06 |
| US-004 | Shopper | As a shopper, I can apply a valid discount code | Server validates active dates, fixed/percentage rules and global usage count; invalid/expired/exhausted code gives a clear error; merchandise total recalculates server-side. | One trimmed case-sensitive code; cap at subtotal; percentage rounds half-up to centavos; quotes consume no use. | P1 | M07 |
| US-005 | Shopper | As a shopper, I can pay securely | Server creates payment with authoritative amount; payment UI never receives server secret; cancellation/failure handled. | PayMongo only for MVP (M08-P01). | P0 | M08 |
| US-006 | Buyer | As a buyer, my successful payment creates exactly one correct order | Verified webhook; duplicate events are idempotent; item names/SKUs/prices snapshot; totals match charged amount; inventory adjusts once. | Redirect alone cannot mark paid. | P0 | M09 |
| US-007 | Customer | As a customer, I can see my order history | Authenticated user sees only own orders; detail route verifies ownership; empty state exists. | No cross-user access. | P1 | M10 |
| US-008 | Admin | As an admin, I can manage catalog products and variants | Create/edit/archive; SKU validation; image upload constraints; server role check + RLS. | No bulk import in MVP. | P1 | M11 |
| US-009 | Admin | As an admin, I can manage inventory | Adjust variant stock; cannot access as customer; changes reflected in storefront availability. | No warehouse/multi-location inventory. | P1 | M11 |
| US-010 | Admin | As an admin, I can manage order fulfillment | View orders and update allowed fulfillment statuses; payment status protected; order detail complete. | No shipping-carrier API required. | P1 | M12 |

