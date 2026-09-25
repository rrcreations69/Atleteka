# Decisions and unresolved requirements

Derived from PRD.xlsx 14_DECISION_LOG!A3:G5 and the cited requirements below. The workbook contains D-001 and the explicitly approved M06-P01; remaining decision rows are blank. Only a decision explicitly marked Approved can override an older PRD requirement. This Markdown file does not grant approval or modify the workbook.

## Approved decision from the PRD

| ID | Date | Decision / Proposal | Rationale | Impact / Changed PRD Sections | Status | Approved By |
| --- | --- | --- | --- | --- | --- | --- |
| D-001 | 2026-09-15 | Adopt monolith-first Next.js + Supabase + Stripe architecture | Minimizes complexity and keeps vibe-coding constrained. | 03_ARCHITECTURE; 12_AI_GUARDRAILS | Approved | Product Owner |

## Bootstrap observations requiring later resolution

These are open observations, not approved decisions. They do not block documentation bootstrap or M00 because M00 adds no commerce schema or behavior. Resolve before the affected milestone, using the smallest secure option within written requirements. If an added field/table/route/package/integration is needed, explain why, propose the minimum change and tradeoffs, and obtain approval first.

| Reference | Observation / problem | Resolution boundary | Relevant milestone |
| --- | --- | --- | --- |
| User DATABASE RULES vs 05_DATA_MODEL rows 14–17 | User lists payments as a core concept; the workbook stores payment_status/Stripe refs on orders and lists webhook_events, but has no payments entity. | Keep the distinction explicit. Decide whether existing order fields satisfy payment persistence; do not create a separate payments table without approval. | Before M02; M08–M09 |
| 06_RLS_AUTH row 6 | inventory/Public/Read derived availability has “Expose internal adjustment controls” in Policy / Server Rule. This contradicts admin-only adjustment and the prohibition on public writes. | Treat the row as an unresolved wording defect. The user's mandatory admin-only invariant governs implementation; do not expose adjustment controls. A workbook correction remains unapproved/unapplied. | M02–M03; M11 |
| 04_ROUTES rows 10–11; 06_RLS_AUTH row 11; 05_DATA_MODEL rows 10–11,14 | Checkout permits optional authentication and guest ownership, but /order/[id] is customer-protected; a secure guest order access strategy is mentioned without details. | Choose a secure supported guest/auth flow before modeling access. Arbitrary order IDs or email alone are not authorization. Any new token field or route needs change control. | M02–M03; M07–M10 |
| 02_SCOPE row 16 vs 04_ROUTES | Supabase password reset is IN, but reset/callback routes are not listed. | Map the auth/reset flow onto approved routes if possible; propose any required additional route explicitly before adding it. | M03 |
| 05_DATA_MODEL rows 10,14,16–17; 08_USER_STORIES US-004/006; 11_TEST_MATRIX T-004/006/012 | Illustrative fields do not settle stock concurrency, coupon usage accounting or durable once-only email delivery/recovery. | Specify transaction, idempotency and persistence behavior before implementation. If current fields cannot satisfy the invariants, propose the smallest schema change and explain tradeoffs. | M02; M07–M09; M13 |
| 02_SCOPE rows 11–13; 05_DATA_MODEL rows 13–14 | Single currency is required by the non-goals, but currency, shipping/tax calculation rules and checkout-address retention on historical orders are unspecified. | Obtain required business rules before checkout. Do not infer currency from workstation timezone or introduce currency choice, tax/carrier integrations or new address fields silently. | Before schema finalization for checkout; M07–M09 |
| 03_ARCHITECTURE row 16 vs 07_ROADMAP M14 | Architecture labels analytics optional while M14 deliverables say basic analytics. | Clarify whether analytics is included and, if so, which of the listed options. Sentry remains the approved monitoring provider. Do not connect analytics during M00. | M14 |
| 03_ARCHITECTURE row 11; 11_TEST_MATRIX T-016 | Upload type/size restrictions are required, but concrete allowed types and maximum size are unspecified. | Define the smallest safe product-image limits before upload implementation; do not silently add media features. | M11 |
| 04_ROUTES row 22; 08_USER_STORIES US-010 | Allowed fulfillment statuses/transitions and degree of auditability are not enumerated. | Define permitted transitions consistent with the PRD; payment state remains tied to the payment system. Additional audit entities/fields require approval. | M02/M12 |

## M00 implementation choices and limitations

M00 implementation was explicitly authorized by the user after bootstrap. No product or architecture change was proposed or approved in this milestone.

- Runtime/package manager: Node.js 24.x and npm 11.x, verified with Node 24.19.0/npm 11.17.0. Direct dependencies are pinned exactly and package-lock.json provides reproducible installation.
- Next.js 16.3.5 App Router with React/React DOM 19.3.0, strict TypeScript 5.9.3, Tailwind 4.3.3 and its PostCSS integration. These implement the approved baseline; no future service SDK is installed.
- shadcn 4.21.0 is manually initialized with components.json (base-nova default, RSC/TSX enabled), neutral CSS tokens, shadcn/tailwind.css, tw-animate-css 1.4.0 and cn 0.3.0. This follows the [official manual initialization](https://ui.shadcn.com/docs/installation/manual). Component/icon/form libraries are deferred until an authorized component requires them. Default initialization tokens are not an approved product design.
- Standard lint tooling uses eslint-config-next 16.3.5 with Core Web Vitals and TypeScript rules. ESLint 9.39.5 is the compatible major for its installed React/accessibility plugins. npm marks ESLint 9 out of support; ESLint 10 is outside those plugins' declared peer ranges. Do not force incompatible peers. This is a documented development-tool maintenance limitation, not a PRD change. The install audit reported zero known vulnerabilities.
- npm reported an unapproved postinstall hook for transitive unrs-resolver. No install hooks were blanket-approved. The actual lint/build checks determine whether the available native packages work; do not approve scripts or weaken checks without a concrete need.
- The PowerShell execution path failed before launch with a Windows CET support error, and sandbox npm access returned EACCES. An elevated Windows command shell with the installed Node/npm executables works. Dependency installation and affected checks use that path; normal application commands remain portable npm scripts. Do not change the product stack to address an agent-host issue.
- Next.js 16.3.5 automatically appended agent guidance during dev startup. Set the supported agentRules option to false and removed only its generated block, preserving the repository-owned PRD operating instructions. This is baseline configuration, not a product change.
- Local Git metadata was initialized on main. No remote, deployment or commit was created. Git inspection from the separate sandbox account uses a per-command safe.directory exception for this exact workspace, without changing global configuration.
- At bootstrap, docs/PRD.xlsx was byte-identical to the supplied workbook. That bootstrap snapshot was unchanged until the authorized M06 progress update below. CURRENT.md and ROADMAP.md distinguish verified implementation status from the workbook snapshot, and require instruction before the next milestone.

Official setup references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Tailwind with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs), [shadcn manual installation](https://ui.shadcn.com/docs/installation/manual). These guide tooling only; the PRD controls product scope.

## M01 implementation choices

M01 was explicitly authorized by the user and verified on 2026-09-16. These are routine implementation choices within its written deliverables, not new product approvals or changes to D-001.

- Retain neutral shadcn tokens and system fonts; add responsive typography, spacing and visible focus styles without remote fonts or assets.
- Reuse cn and existing shadcn CSS for small native Button, Card, Input, Label and TextField adaptations. No optional component/form package, polymorphic API or client component is needed for presentational primitives.
- Header/footer links target the existing home page and in-page anchors. No future navigation, empty menu or public component-gallery route is added. Actual form controls are exercised in an isolated local verification fixture without data processing or network submission.
- No PRD conflict requires a M01 scope change. Database, environment, dependency and PRD changes: none. Previously recorded future-milestone observations remain unresolved and unchanged.

## M02 implementation choices and boundaries

M02 was explicitly authorized by the user after M01. Its schema uses only the workbook entities/fields; no product or architecture deviation is proposed. Concrete field/type/constraint choices are in DATABASE.md.

- Keep payment persistence on orders and webhook_events as the workbook specifies. No separate payments table is needed for M02. Transactional payment finalization remains M09 work.
- The illustrative alternatives are resolved minimally: variant title, variant-only price and product image storage_path. Optional unused fields are omitted. Exact numeric storage does not choose merchant currency or rounding. Unspecified status/type values have no invented workflow or enum; profiles alone uses the explicit customer/admin values.
- Basic constraints and immutable line snapshots protect the stored model. RLS plus revoked client grants closes access immediately. No Auth hooks, token issuance, admin helper, application clients or M03 policies are prepared. Previously recorded guest-access, checkout, coupon and email questions remain open for their owning implementation; closed tables do not require those workflows in M02.
- The hosted project contained the platform rls_auto_enable() event-trigger function before the M02 migration. The security advisor found unnecessary client execution grants. A narrow, conditional migration revokes those grants and preserves its body/trigger. This is database configuration hardening, not a new service or product feature.
- No application package is added. A portable official PostgreSQL 17 runtime under ignored .verification was used for isolated clean replays, with an auth.users key stub. Hosted tests verified real Supabase roles/Auth. Full Docker-based Supabase startup was not run because Docker/CLI are absent. See supabase/README.md for the standard workflow.
- MCP applied both migrations; local filenames match the returned versions and SQL hashes match remote history. The development seed is repeatable and also verified on the hosted project. No credentials were requested, logged or stored.

## Change-control procedure

1. Identify the problem and the conflicting or insufficient PRD section.
2. Explain why the existing PRD cannot satisfy it.
3. Propose the smallest change, affected sections, schema/routes/packages and tradeoffs.
4. Record proposed status and request explicit approval before implementation.
5. Only a genuinely approved PRD/decision-log update supersedes older requirements. Preserve the distinction between approved decisions and observations. Keep derived docs aligned afterward.

## M04 approved business clarification

- 2026-09-17: User explicitly selected PHP as the single catalog currency in response to the M04 currency question. Status: Approved by the user in this session. This resolves catalog price display only; it does not define checkout tax/shipping/rounding rules or introduce multiple currencies. The workbook was unchanged at that M04 checkpoint.

## M06-P01 - Cart access and stock validation

Status: Approved explicitly by the user; M06 implementation complete and verified (2026-09-23).

The M06 brief requires approval before schema changes. Existing cart tables fit the PRD, but guest access is closed and authenticated direct writes only enforce ownership/positive quantities. Approved and implemented: one migration adding narrowly granted cart routines/private helpers, guest/customer RLS and write restrictions, atomic stock-checked mutations, and an active-customer-cart uniqueness index if required. Reuse existing tables/fields; no new package, service or environment secret.

Guest ownership: server-issued random 256-bit HttpOnly/SameSite cookie, Secure on HTTPS, 30-day persistence; store only its hash in existing guest_token. Authenticated ownership: verified session and auth.uid(). Separate guest/account carts; no automatic merge. Reject above-stock quantities, with explicit removal as the only zero-quantity operation; server re-fetches prices/stock. No reservations, stock deductions or checkout.

Alternatives and tradeoffs, exact scope, implementation plan and verification gates are recorded in CURRENT.md. The user authorized narrow PRD updates and subsequently requested the progress update first. On 2026-09-22, the workbook records M06-P01 and marks M06 In Progress, distinguishing verified database work from pending cookie/actions/UI/browser verification; M01-M05 and unrelated requirements are preserved. The user chose to finish M06 before M07. No further approval is needed for this scoped work.

The 2026-09-23 completion update changes only M06 status/deliverable progress and its decision-log progress note, plus dependent dashboard caches. Approved requirements are unchanged; no deviation or new proposal.

## M07-P01 - Checkout policy and coupon usage availability

Original proposal (2026-09-23), superseded by the explicit M07-P01 approval below (2026-09-24). The latest user brief authorizes M07 but requires a stop for schema/PRD changes and meaningful business/security choices. This section preserves the original proposal; the later approval section identifies the final authorized and implemented behavior.

### Evidence and blocker

M07 requires address collection, authoritative totals and discount validation. US-004/T-012 require checking usage limits. The actual discounts table has code, type, value, active, starts_at, ends_at and usage_limit, but no prior-use count. Orders contain no discount reference. Direct discounts access is admin-only. The PRD does not settle shipping/tax/geography, discount type semantics or checkout rounding. PHP approval in M04 covers catalog display only.

### Smallest proposal

- Confirm PHP for checkout. Ask the merchant for delivery countries, shipping fee/rule and tax treatment/base; no zero amount or tax rate is assumed.
- Collect one shipping address, also used for billing, transiently in the current M07 form. No saved-address management, guest address rows or historical order persistence.
- Support one fixed-PHP or percentage coupon. Cap the discount at merchandise subtotal; percentage discounts round half-up to centavos. Reject catalog amounts with unsupported fractional-cent precision instead of silently changing their price. Trim code input and retain existing case-sensitive matching. Reject unknown types and malformed configuration.
- Define usage_limit as a global count of successful redemptions. Add only discounts.redemption_count: nonnegative integer, not null, default 0. No redemption/attempt table, per-user tracking or new package.
- Add a narrow read-only checkout calculation RPC using the existing cart ownership/security pattern. Re-read current active products, variant prices and stock; reject the entire quote for unavailable/invalid lines. Validate active/date/type/value/usage rules, and derive all totals from database values and approved server policy. Do not accept owner IDs, prices, counters or rates as authoritative inputs.
- Restrict writes to the counter from anon/authenticated clients, including broad existing table grants. Preserve admin permissions for the existing discount configuration columns. Quotes do not increment the counter or reserve discounts/stock.
- Do not implement a redemption writer, Stripe, payment sessions, orders or webhook behavior. Real payment-time exactly-once consumption remains a later milestone requirement; this proposal is limited to M07 quote-time availability and does not claim final-purchase concurrency enforcement.
- No environment variable/secret, service, new business table or architecture replacement.

### Alternatives and tradeoffs

1. Counter plus narrow calculation RPC (recommended): smallest persisted value needed for M07 availability checks. It cannot provide a redemption audit trail or per-customer limits. Those are not requested. If pre-existing real coupon usage exists at migration time, zero cannot be assumed; verify data and obtain a count before backfill.
2. Revise the M07 PRD to exclude usage-limited coupons: avoids the field, but changes US-004/T-012 and cannot be silently substituted for current acceptance.
3. Introduce a redemption ledger: supports historical records but adds an entity and payment-lifecycle concerns beyond this bounded M07 need; not recommended now.

On approval, update only affected PRD scope/model/security/story/decision entries and derived docs. Preserve M01-M06 and all unrelated requirements. No workbook change has been made while this proposal is pending.

### Dependency and continuation

M06 is verified. M03's full verification remains incomplete; customer cart login/logout evidence is not admin, refresh, confirmation or recovery verification. M07 authorization supersedes the old handoff instruction to seek permission merely to assess M07, but does not turn missing tests into passes. See CURRENT.md for the implementation plan and exact next action.

## M07-P01 approval - 2026-09-24

Status: Approved by explicit user replies. Supersedes the pending proposal above: PHP; Philippines-only delivery; tax included in prices; shipping fee pending third-party confirmation, with merchandise total after discounts and no final payable total. The user explicitly approved the coupon/database proposal unchanged and then the pending-shipping display. The user changed the address proposal to save account addresses for future orders; guest addresses remain transient. Reuse existing addresses and ownership RLS for minimal save/reuse at checkout; no address management route. Fixed/percentage single coupon, cap/rounding/case-sensitive rules and protected redemption_count/read-only quote routine are approved. No payment-time redemption, orders, Stripe or future milestone functionality. Existing hosted discounts/orders counts were both zero before migration, so no historical counter backfill is required.
