# Project operating instructions

## Source of truth and current authorization

This is a PRD-driven project. [docs/PRD.xlsx](docs/PRD.xlsx) is the primary product source of truth. The Markdown files are derived navigation and operating guidance, not a replacement specification. The user's explicit session instructions govern authorized work.

Read [docs/CURRENT.md](docs/CURRENT.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/ROADMAP.md](docs/ROADMAP.md), [docs/DATABASE.md](docs/DATABASE.md), [docs/SECURITY.md](docs/SECURITY.md), and [docs/DECISIONS.md](docs/DECISIONS.md) before modifying code. Read the relevant workbook sheets and acceptance criteria directly. Inspect the existing implementation and identify PRD conflicts before changing it.

The user has authorized bounded M07 implementation after verified M06. M07-P01 and the checkout business rules are explicitly approved in docs/DECISIONS.md; M03 verification remains incomplete as recorded in docs/M03_CHECKPOINT.md. Work only on the current milestone and respect its recorded status in CURRENT.md. Stop and report before beginning the next milestone unless explicitly instructed to advance.

## Scope and stack

- Implement only scope rows marked IN, in roadmap order. Non-goals and OUT rows are hard constraints. Do not invent features or future infrastructure.
- Use Next.js App Router, strict TypeScript, Tailwind CSS, shadcn/ui, Supabase Postgres/Auth/Storage/RLS, Zod, React Hook Form where useful, Stripe, Resend, Vercel, and Sentry.
- Do not substitute Prisma, Firebase, another database/auth/UI/styling provider, GraphQL, Redis, microservices, Kafka, or Kubernetes without explicit approval.
- No reviews, wishlists, loyalty/referrals, recommendations, subscriptions, multi-vendor, multi-currency, native mobile apps, bulk import, warehouse/multi-location inventory, complex coupon stacking, advanced search infrastructure, or unnecessary CMS.
- Inspect and reuse components/utilities before adding duplicates. Keep modules small, focused, and clearly named. Avoid any unless specifically justified, premature abstractions, and speculative frameworks.
- Prefer Server Components. Client Components require actual interaction or browser APIs. Prefer Server Actions/Route Handlers where appropriate, without an unnecessary API layer.
- Supabase migrations are the schema source of truth. Every schema change requires a migration. Follow the PRD logical model; do not casually add entities or fields.

## Mandatory security boundaries

- Validate trust boundaries with Zod, including server mutations and relevant external payload assumptions. Client validation is only UX.
- Never trust browser prices, totals, discounts, inventory, payment/order status, role, or ownership. Re-fetch and validate authoritative data on the server.
- Enforce customer ownership with server checks and RLS. Require server-confirmed admin authorization and appropriate RLS for privileged mutations. Customers cannot edit their role. Hidden UI is never authorization.
- Product media writes are admin-only with file-type and size validation.
- Keep service-role, Stripe secret/webhook, and Resend keys out of client code and logs. Keep .env.example current with placeholders only. Scrub secrets and PII from monitoring.
- Only a signature-verified, deduplicated Stripe webhook can finalize trusted paid state. Redirects cannot mark orders paid. Duplicate events must not duplicate orders, inventory deductions, or emails. Browser closure must not block finalization.
- Inventory is variant-level. Order items snapshot SKU, product/variant names, unit price, quantity, and line total. Prefer archive/inactive states for catalog history.

## Milestone workflow and verification

1. Read the current milestone, dependencies, relevant PRD sections, stories, and test matrix.
2. Inspect current code and restate acceptance criteria. Plan files/modules, schema and environment impact, security, tests, risks, and exclusions.
3. Implement only authorized current work, reusing existing pieces.
4. Update relevant migrations, validation, tests, .env.example, and derived docs when required.
5. Run lint, TypeScript typecheck, and relevant automated/manual tests after meaningful changes. Do not claim a command passed if it was unavailable or not run.
6. Verify each acceptance criterion individually. Include loading, empty, error, unauthorized, not-found, accessibility, and mobile/desktop states where applicable. Security and money failures are blockers.
7. Report changed files, verification evidence, known limitations, and acceptance results. Never mark a milestone complete without verification. No known P0 issue may remain; launch also requires critical P0/P1 defects closed.
8. Stop before the next milestone unless explicitly instructed. Keep CURRENT.md accurate. Do not change workbook status simply because a plan or partial deliverable exists.

## Change control

For a necessary feature, package, service, table, field, route, integration, infrastructure component, or architecture change not described in the PRD: explain the problem, why existing requirements cannot satisfy it, the smallest proposal and tradeoffs; record it as proposed and wait for approval before implementation. Only an explicitly Approved decision can override an older requirement. Never label a proposal approved on the user's behalf.

When ambiguous, choose the smallest secure implementation satisfying the PRD. If that still requires expanding or contradicting the PRD, use change control. Preserve unresolved questions in DECISIONS.md.

Sources: PRD 00_START_HERE, 01_EXEC_SUMMARY, 02_SCOPE, 03_ARCHITECTURE, 05_DATA_MODEL, 06_RLS_AUTH, 07_ROADMAP, 08_USER_STORIES, 10_ENV_INTEGRATIONS, 11_TEST_MATRIX, 12_AI_GUARDRAILS, 13_MASTER_PROMPT, 14_DECISION_LOG; user's bootstrap and operating instructions.
