# Implementation roadmap

Derived from PRD.xlsx 07_ROADMAP!A3:I20. Read 08_USER_STORIES and 11_TEST_MATRIX for behavioral and launch gates. Follow workbook order, one milestone at a time, even where dependencies would permit parallel work.

## Current state

M00-M02 are verified. M03 is implemented but its browser auth verification remains incomplete (see M03_CHECKPOINT.md). M04 is verified (see M04_CHECKPOINT.md). The user authorized M05 on 2026-09-21; M05 search and filters are complete and verified (see M05_CHECKPOINT.md). M06 is complete and verified following approval of M06-P01; see M06_CHECKPOINT.md. The user authorized M07 on 2026-09-23; M07-P01 and merchant rules are approved. Checkout implementation is present and final verification is recorded in CURRENT.md. The M03 dependency remains incompletely verified (one check left). On 2026-09-25 the user authorized M08 with M03/M07 still open and approved M08-P01 (PayMongo replaces Stripe; merchandise-only charge, shipping paid to the courier on delivery). M08 is In Progress; M09+ is unstarted.

The table below reflects workbook statuses after the user-authorized 2026-09-25 status correction: M00, M01, M02, M04, M05 and M06 are Done (verified per their checkpoints); M03 and M07 are In Progress (M03 browser/email verification incomplete; M07 open only for that dependency). M08 became In Progress with M08-P01 on 2026-09-25. Verified execution history is recorded above and in milestone checkpoints.

| ID | Milestone | Priority | Dependency | Workbook status | Deliverables | Definition of Done / Acceptance Criteria | Owner | Estimate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M00 | Repository & engineering baseline | P0 | None | Done | Next.js TS app; Tailwind; shadcn; lint/typecheck; env example; AGENTS.md/AI rules | App runs locally; lint/typecheck pass; secrets excluded; conventions documented. | Eng | S |
| M01 | Design system & shell | P0 | M00 | Done | Typography, spacing, header/footer, buttons/cards/forms, responsive container | Consistent layout on mobile/desktop; reusable primitives; no feature business logic yet. | Frontend | S |
| M02 | Supabase & schema | P0 | M00 | Done | Supabase project config, migrations, data model, seed script | Schema matches PRD; migrations reproducible; seed creates usable catalog data. | Backend | M |
| M03 | Authentication & authorization | P0 | M02 | In Progress | Login/register/session, profiles, customer/admin roles, RLS | Customer/admin access tests pass; privilege escalation blocked. | Backend | M |
| M04 | Catalog | P0 | M01,M02 | Done | Shop, category, product detail, images, variants, availability | Active catalog renders from DB; invalid/inactive routes handled; responsive. | Full Stack | M |
| M05 | Search & filters | P1 | M04 | Done | Basic search/category/availability filtering | URL/state predictable; no overbuilt search service. | Full Stack | S |
| M06 | Cart | P0 | M04 | Done | Add/update/remove, persistence, subtotal display, empty/error/loading states. Database/RLS, cookie, Server Actions, UI and guest/account browser flows verified on 2026-09-23. | Variant-aware; positive integer quantity within stock; current server prices/subtotal. Secure 30-day hashed guest identity; separate account carts, no merge. Complete only after end-to-end verification. | Full Stack | M |
| M07 | Checkout foundation | P0 | M03,M06 | In Progress | PH address/account reuse, authoritative PHP merchandise quote, discount validation; M03 dependency verification incomplete | Current prices/stock and single coupon validated server-side; tax included; shipping/final payable total pending; account addresses isolated. | Backend | M |
| M08 | PayMongo payment | P0 | M07 | In Progress | PayMongo hosted checkout session and safe metadata; merchandise-only charge (shipping paid to courier on delivery) | Client cannot choose price/total; test payment can complete. | Backend | M |
| M09 | Webhook & order creation | P0 | M08 | Not Started | Signature verification, idempotency, order snapshots, payment state, inventory adjustment | Duplicate webhook safe; browser close after pay still produces correct order; no double inventory deduction. | Backend | L |
| M10 | Customer account | P1 | M03,M09 | Not Started | Order history/detail, addresses, settings | Users only see own data; empty/loading/error states included. | Full Stack | M |
| M11 | Admin products/categories/inventory | P1 | M03,M04 | Not Started | Admin CRUD/archive and stock management | All mutations admin-only; images validated; no destructive accidental deletion. | Full Stack | L |
| M12 | Admin orders | P1 | M09 | Not Started | Order list/detail and fulfillment status updates | Payment status protected; fulfillment updates auditable enough for MVP. | Full Stack | M |
| M13 | Transactional email | P1 | M09 | Not Started | Order confirmation email | Sent once per paid order event; failure is logged without corrupting order. | Backend | S |
| M14 | Observability & analytics | P1 | M00 | Not Started | Sentry; basic analytics | Production errors visible; no secrets/PII leakage in logs. | Eng | S |
| M15 | Security & abuse review | P0 | M03-M14 | Not Started | RLS review, price tampering, role abuse, upload validation, webhook replay checks | Critical abuse cases in test matrix pass. | Security | M |
| M16 | QA & launch | P0 | M15 | Not Started | E2E critical path, performance/accessibility sanity, production env/deploy | Launch checklist complete; critical P0/P1 defects closed. | Team | M |

## Verified milestone history

- M00: exact locked baseline installed; local root returned HTTP 200; lint, strict typecheck and production build exited 0. shadcn configuration and cn merging verified. Desktop/mobile browser checks passed, with one main/h1, no overflow or runtime errors and expected unknown-route 404. Placeholder-only environment, Git secret exclusions and static-asset secret checks passed. Documentation records setup and conventions. No schema or services added. Original detailed evidence is also preserved locally in .verification/m01-baseline/docs/CURRENT.md.
- M01: typography/spacing, responsive shell and reusable buttons/cards/form fields implemented. Lint/typecheck/build passed; Chrome shell checks at 1440/768/390/320px and isolated actual-component checks passed. Keyboard, disabled/required/error states, contrast and screenshots verified. Scope audit confirms no feature business logic, dependency, environment or schema changes. Prior detailed M01 evidence is preserved locally in .verification/m02-baseline/docs/CURRENT.md.

- M02: 14-table schema, local configuration, two hosted migrations and repeatable development catalog seed. Clean PostgreSQL 17 replays produce identical schemas; SQL constraint/snapshot/RLS tests and hosted checks pass. Lint/typecheck/build pass. No application code, dependency, environment or PRD changes. See CURRENT.md for exact migration versions, evidence and limitations.

## Workflow

Read relevant requirements and inspect existing code. Restate acceptance criteria and dependencies. Plan expected files, schema, security, environment, tests, risks, and exclusions. Implement only the authorized milestone. Run lint, typecheck, and relevant tests. Verify every criterion individually and report evidence and limitations. Stop before the next milestone unless explicitly instructed.

A plan or created files alone do not establish completion. Required functionality, security/RLS/validation, applicable UI states and responsive/accessibility behavior must work. No known P0 issue may remain; M16 requires critical P0/P1 defects closed. If checks cannot run, document that limitation and leave affected criteria unverified.

## Dashboard and status preservation

15_DASHBOARD cached results after the 2026-09-25 status correction: 17 total, 6 Done, 2 In Progress, 0 Blocked, 9 Not Started (35.29% complete). Formulas are unchanged and the workbook recalculates fully on load. Read milestone checkpoints for actual execution history. Native Excel recalculation was not exercised.

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

