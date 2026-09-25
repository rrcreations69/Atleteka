# Architecture and product boundaries

Derived from PRD.xlsx sheets 01_EXEC_SUMMARY, 02_SCOPE, 03_ARCHITECTURE, 04_ROUTES, 09_COMPONENTS, and 10_ENV_INTEGRATIONS. The workbook remains authoritative. Approved decision D-001 confirms this architecture.

## Product understanding

A modern single-store, direct-to-consumer e-commerce web application for one merchant. Guests browse and shop; registered customers manage their own account/orders; administrators manage catalog, inventory, and fulfillment. Reliable transactions and data correctness take priority over novelty.

MVP success: browse, select a variant, add to cart, pay, receive confirmation, and see the order in account; administrators can manage products, orders, and inventory. Core flows must work on mobile and desktop.

Approved scope includes active catalog/category/detail pages, basic database-backed search and filters, variant-aware persistent cart, minimal checkout addresses, Stripe payment, one valid discount, trusted orders and confirmation email, Supabase authentication/reset, own order history and saved addresses, admin catalog/category/inventory/fulfillment management, error monitoring, and basic SEO metadata. Optional details stay optional: price-range filtering, simple category hierarchy if needed, reusable checkout addresses if simple, and analytics as described in the architecture. Analytics wording differs in M14; see DECISIONS.md.

Non-goals include reviews, wishlists, recommendations, loyalty, subscriptions, multi-currency, multi-vendor/marketplace, native mobile apps, microservices, Kafka, Kubernetes, GraphQL, advanced search infrastructure, complex coupon stacking, and unnecessary CMS. User stories also exclude bulk import and warehouse/multi-location inventory; shipping-carrier APIs are not required.

## Request and data flow

Browser → Next.js Server Components / Server Actions / Route Handlers → Supabase / Stripe / Resend.

One repository and a monolith-first application. Server Components are the default; interactive islands use Client Components. Avoid redundant API layers and speculative abstractions. Authorization belongs on the server and in Supabase RLS. Migrations own schema changes.

| Layer | Technology / Pattern | Responsibility | Hard Rule |
| --- | --- | --- | --- |
| Web app | Next.js App Router + TypeScript | Pages, layouts, Server Components, Server Actions/route handlers where appropriate | Server Components by default; client components only when interactivity/browser APIs require them. |
| UI | Tailwind CSS + shadcn/ui | Design system and reusable interface primitives | Reuse primitives; no parallel styling framework. |
| Validation | Zod | Validate user/server inputs and webhook payload assumptions | Validate at trust boundaries. |
| Forms | React Hook Form + Zod | Client-side form UX for complex forms | Server validates again; client validation is convenience only. |
| Database | Supabase Postgres | Products, variants, inventory, carts/orders, addresses, discounts | Migrations are source of truth. No schema drift. |
| Auth | Supabase Auth | Identity and sessions | Authorization is checked server-side and via RLS. |
| Authorization | Supabase RLS + server checks | Data isolation and privilege enforcement | Never rely only on hidden buttons/routes. |
| Storage | Supabase Storage | Product images/media | Restrict upload type/size; admin-only writes. |
| Payments | Stripe | Payment collection | Never trust client amount. Server calculates amounts; verified webhook is authoritative. |
| Email | Resend | Transactional emails | Triggered from trusted server events; avoid client-triggered arbitrary sends. |
| Hosting | Vercel | Deploy Next.js application | Use environment separation for preview/production. |
| Monitoring | Sentry | Error and exception monitoring | No secrets/PII in logs. |
| Analytics | Vercel Analytics or PostHog (optional) | Basic product analytics | Do not block MVP on advanced event taxonomy. |
| Repository | Single repo | Application + migrations + scripts + tests + docs | No microservices or extra repositories in MVP. |

## Approved route map

Only these MVP routes are listed. Reset/callback and guest-access questions are recorded in DECISIONS.md; do not add routes silently. This route inventory does not authorize building them before their milestone.

| Route | Audience | Render/Auth | Purpose | Notes |
| --- | --- | --- | --- | --- |
| / | Public | Server | Home/merchandising landing | Keep focused; no unnecessary CMS in MVP. |
| /shop | Public | Server | All active products | Search/filter parameters via URL where useful. |
| /products/[slug] | Public | Server + client island | Product details and variant selection | Variant picker/add-to-cart may be client component. |
| /categories/[slug] | Public | Server | Category products | 404 invalid category. |
| /search | Public | Server | Search results | Simple query parameter q. |
| /cart | Public | Mixed | Review/update cart | Server revalidates price/stock. |
| /checkout | Public/Auth optional | Mixed | Checkout flow | No admin logic here. |
| /order/[id] | Customer | Server protected | Post-purchase order view | Verify ownership. |
| /login | Guest | Client/form | Login | Redirect authenticated users appropriately. |
| /register | Guest | Client/form | Registration | Minimal fields. |
| /account | Customer | Server protected | Account dashboard | Own data only. |
| /account/orders | Customer | Server protected | Order history | Own orders only. |
| /account/addresses | Customer | Server protected | Saved addresses | Own addresses only. |
| /account/settings | Customer | Server protected | Profile basics | Do not expose sensitive auth internals. |
| /admin | Admin | Server protected | Admin dashboard | Hard server role check. |
| /admin/products | Admin | Server protected | Product management | CRUD/archive. |
| /admin/categories | Admin | Server protected | Category management | CRUD. |
| /admin/orders | Admin | Server protected | Order management | Fulfillment/status actions. |
| /admin/inventory | Admin | Server protected | Variant inventory | Adjust stock with audit-friendly updates. |
| /api/stripe/webhook | Stripe only | Route handler | Receive Stripe webhook | Verify signature; idempotent. |

## Reusable component inventory

Create components when their milestone needs them. Reuse existing primitives before making new ones. M00 initializes shadcn configuration; M01 owns the design system and shell, and later milestones own business components.

| Component | Category | Responsibility | Rule |
| --- | --- | --- | --- |
| ProductCard | Catalog | Image, name, price, availability, link | No data fetching inside if parent can pass data cleanly. |
| ProductGrid | Catalog | Responsive collection of ProductCard | Handles empty state via composition. |
| ProductGallery | Product | Main image/thumbnails | Accessible alt text. |
| VariantSelector | Product | Select variant/options | Client component; no price authority. |
| PriceDisplay | Product | Formatted price/compare-at price | Formatting only. |
| QuantitySelector | Commerce | Increment/decrement with limits | Never bypass server inventory validation. |
| AddToCartButton | Commerce | Cart mutation UX | Disabled when invalid/sold out; loading state. |
| CartItem | Cart | Line item edit/remove | Reusable in cart drawer/page if both exist. |
| CartSummary | Cart | Subtotal/discount/estimated totals display | Display only; checkout server recalculates. |
| AddressForm | Checkout/Account | Address capture/edit | Shared schema where possible. |
| CheckoutSummary | Checkout | Authoritative checkout breakdown returned by server | No client-only money math. |
| OrderStatusBadge | Orders | Visual status token | Single mapping source. |
| DataTable | Admin | Reusable table shell | Do not over-generalize into framework. |
| ConfirmDialog | Admin | Destructive/archive confirmations | Prefer archive for catalog. |
| EmptyState | System | Consistent empty UI | Reusable. |
| ErrorState | System | Consistent recoverable error UI | Do not expose stack traces. |
| LoadingState/Skeleton | System | Predictable loading UI | Avoid random spinners everywhere. |

## Environment and integrations

Document names and placeholders in M00; introduce actual connections only in the owning milestone. Do not require future credentials just to run the baseline. The PRD does not specify concrete credentials, project IDs, package versions, currency, shipping/tax rules, or upload limits.

| Variable / Integration | Exposure | Required | Purpose | Rule |
| --- | --- | --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Public | Yes | Supabase project URL | Safe for browser. |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public | Yes | Supabase anonymous key | RLS must make it safe. |
| SUPABASE_SERVICE_ROLE_KEY | Server only | Maybe | Privileged server/admin/service operations if needed | Never expose to client or NEXT_PUBLIC prefix. |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Public | Yes | Stripe client initialization | Safe for browser. |
| STRIPE_SECRET_KEY | Server only | Yes | Create Stripe server-side resources | Never log or expose. |
| STRIPE_WEBHOOK_SECRET | Server only | Yes | Verify Stripe webhook signatures | Required for trusted payment state. |
| RESEND_API_KEY | Server only | Yes | Transactional email | Server only. |
| NEXT_PUBLIC_APP_URL | Public | Yes | Canonical app URL / redirects | Use correct environment value. |
| SENTRY_DSN / related | Mixed | Recommended | Error monitoring | Scrub PII/secrets. |
| .env.example | Repository | Yes | Documents required variable names | Contains placeholders only, never real secrets. |

## Implementation philosophy

Build one bounded milestone, verify it, report, then wait for instruction. Keep strict TypeScript, clear naming, minimal duplication, semantic HTML, labels, keyboard/focus support, and relevant loading/empty/error/unauthorized/not-found states. Derived documents summarize requirements; approved scope changes belong in the PRD/decision log.

## Implemented baseline (M00)

The repository now contains a minimal Next.js App Router root page/layout, strict TypeScript, Tailwind/PostCSS, manual shadcn initialization, lint/typecheck/build scripts, environment placeholders, a single npm lockfile and documented local commands. See README.md for exact versions, ROADMAP.md for M00 evidence and CURRENT.md for current verification. Only / has application implementation; Next.js supplies its built-in not-found handling. No schema, authentication, RLS, service integration or product business logic has been added.

## Implemented design system and shell (M01)

M01 adds a shared responsive Container, SiteHeader/SiteFooter, semantic main landmark and keyboard skip link. The root remains coming-soon content. Existing neutral shadcn tokens/system fonts now include responsive display typography and visible focus/contrast defaults.

Button, Card family, Input, Label and TextField are native-element adaptations using the existing cn helper and shadcn CSS. TextField composes labels, help and error associations; native required/disabled behavior is preserved. Optional component packages and polymorphism were unnecessary for this scope. No new dependency, route, client component, schema, integration or trust boundary was introduced. Future data-processing forms must apply server-side validation and authorization in their owning milestone.

## Implemented database foundation (M02)

The connected Atleteka Supabase project now has the 14-table PRD schema, two recorded migrations and a synthetic development catalog. Supabase configuration, migrations, seed and transactional SQL tests live in supabase/. No application SDK or new route is introduced. Exact decimal money and database constraints preserve basic integrity; application business rules remain in their owning milestones.

All application tables have RLS enabled with access denied to anon/authenticated; M03 permission policies and Auth flows are unimplemented. A narrow second migration restricts client execution of the pre-existing platform automatic-RLS helper without changing its behavior. The M01 UI and package/environment files remain unchanged. See DATABASE.md and CURRENT.md for exact schema choices and verification limits.

## Current M03/M04 implementation boundary

M03 introduces the approved Supabase/Zod Auth implementation and database permissions but remains incompletely browser-verified (M03_CHECKPOINT.md). M04 public catalog is independent of Auth: /shop, /categories/[slug] and /products/[slug] use anonymous server queries, a derived availability projection and existing UI primitives. Only gallery, variant selection and image-error behavior require Client Components. PHP is the user-confirmed single display currency. No new dependency, service, business entity or API layer is introduced.

## Implemented search and filters (M05)

The approved /search route and shared shop/category listings support literal case-insensitive product-name search, active categories and in-stock filtering. GET forms keep q/category/availability/page state in URLs; Server Components use the existing anonymous Supabase client and Zod boundaries. Exact inventory remains private. In-stock requests scan matching products in bounded batches against existing derived availability before counting/pagination; other queries paginate in the database. No schema, dependency, environment, client component or search service was added. See CURRENT.md for verification and the linear-scan limitation. M06 subsequently entered implementation; see the cart database boundary below.

## M06 verified cart implementation

M06 is complete. Existing carts/cart_items are accessed through narrow invoker RPC wrappers with private authorization/stock helpers and owner-only RLS reads. Server Actions and /cart reuse the current stack and UI primitives. Proxy issues a host-only 30-day HttpOnly/SameSite=Lax guest cookie, Secure on HTTPS, and refreshes sessions for product/cart routes. Server-confirmed accounts and hashed guest ownership remain separate; there is no merge.

Zod validates mutations and RPC payloads. Prices, line totals and subtotal come from the database; UI formats decimal strings in PHP. Cart UI handles invalid quantities, changed stock, inactive items, loading/empty/error/pending states and accessible responsive controls. No entity, field, dependency, service, environment secret or M07 behavior was added. See CURRENT.md for acceptance evidence.

## M07 checkout foundation (implemented)

M07-P01 is explicitly approved. /checkout reuses the cart client, ownership model, secure cookie and existing UI primitives. A Server Action validates the Philippines-only address and single coupon with Zod. Verified accounts save/reuse their own existing address rows; guests keep address data in the current form. There is no new account-management route.

The read-only checkout_quote RPC derives current prices/stock and discount eligibility using one database statement snapshot. PHP merchandise totals include tax. Shipping fee and final payable total remain null/pending confirmation, as approved for third-party shipping. No payment amount, order, reservation, redemption consumption or carrier integration is created. The only new field is the approved discounts.redemption_count. No new packages, services or environment variables. See CURRENT.md for verification and the remaining M03 dependency.
