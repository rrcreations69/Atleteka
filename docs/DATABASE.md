# Database requirements

Derived from PRD.xlsx 05_DATA_MODEL!A3:E17, 03_ARCHITECTURE, 06_RLS_AUTH, and 08_USER_STORIES. M02 implements this logical model through migrations in supabase/migrations/. The table below preserves the workbook wording; concrete choices are recorded below. Current M03/M04/M06/M07 additions and verification limits are recorded below.

## Schema authority

Use Supabase Postgres. Supabase migrations are the schema source of truth and must be reproducible. Never make manual schema changes without a migration. Do not add Prisma or another database. Fields below are explicitly labeled illustrative in the workbook; question marks and alternatives remain unresolved/optional, not required new fields.

| Entity / Table | Key fields (illustrative) | Purpose | Relationships | Rules |
| --- | --- | --- | --- | --- |
| profiles | id (auth user FK), display_name, role, created_at | App profile/role extension | 1:1 with auth.users | Role values customer/admin. Do not duplicate password/auth secrets. |
| products | id, slug, name, description, status, base_price?, created_at, updated_at | Parent product | 1:M variants, 1:M images, M:M categories | Prefer variant price as source when variants exist; slug unique. |
| product_variants | id, product_id, sku, title/options, price, compare_at_price?, active | Sellable SKU | M:1 product, 1:1 or 1:M inventory | SKU unique; price non-negative. |
| product_images | id, product_id, storage_path/url, alt_text, sort_order | Product media | M:1 product | Admin writes only. |
| categories | id, slug, name, description?, active | Catalog grouping | M:M products | Slug unique. |
| product_categories | product_id, category_id | Join table | M:M products/categories | Composite unique. |
| inventory | variant_id, quantity_on_hand, reserved? | Variant stock | 1:1 variant for MVP | Never allow purchase above available; updates from trusted server/admin. |
| carts | id, user_id?, guest_token?, status, updated_at | Shopping cart | 1:M cart_items | Guest or user ownership. guest_token stores only the secret hash. One active cart per user; guest and account carts remain separate. |
| cart_items | id, cart_id, variant_id, quantity | Cart lines | M:1 cart, M:1 variant | Unique cart+variant; positive integer quantity, checked against current stock by server routines. Add increments atomically; explicit remove deletes the line. |
| addresses | id, user_id, type?, name, line1, line2?, city, region, postal_code, country, phone? | Saved addresses | M:1 user | User owns rows. |
| orders | id, user_id?, email, status, payment_status, subtotal, discount_total, shipping_total, tax_total, grand_total, currency, payment provider refs (PayMongo; column rename proposed in M09), created_at | Commercial order | 1:M order_items | Store immutable price snapshot; totals server-generated. |
| order_items | id, order_id, variant_id?, sku, product_name, variant_name, unit_price, quantity, line_total | Immutable order line snapshot | M:1 order | Do not depend on mutable catalog data for historical display. |
| discounts | id, code, type, value, active, starts_at?, ends_at?, usage_limit?, redemption_count | Simple coupon/discount | Applied during checkout | Server validation; no stacking in MVP unless added. |
| webhook_events | provider_event_id, type, processed_at, payload_hash? | Webhook idempotency/audit | PayMongo events | Unique provider_event_id to prevent double-processing. |

## Relationships and integrity

- profiles is a 1:1 extension of auth.users; auth secrets/passwords remain with Supabase Auth. Roles are customer/admin; customers cannot edit role.
- products has many product_variants and product_images. Categories join through product_categories, unique by product/category pair.
- product slug, category slug, and SKU are unique. Variant prices are non-negative; prefer variant pricing when variants exist.
- inventory is 1:1 with variant for MVP, despite the broader relationship illustration on product_variants. Availability/purchase limits are server-enforced. Do not introduce warehouse/multi-location inventory.
- carts supports customer or guest ownership. cart_items is unique by cart/variant, has a positive quantity, and must pass current stock validation.
- addresses belongs to a user; clients cannot override ownership.
- orders has many immutable order_items. Snapshot SKU, product/variant names, unit price, quantity, and line total. Historical order display cannot depend on mutable catalog values. Order totals and payment state come from trusted server/payment processing.
- discounts is a single-code flow with server validation of active status, dates, usage and rules. No stacking. M07 compares the protected redemption_count with the global limit at quote time. Payment-time consumption remains outside M07.
- webhook_events has a unique provider_event_id. Deduplication must protect orders, inventory and confirmation delivery, including duplicate events and retries.
- Prefer archive/inactive catalog states to preserve history. Product media uses Supabase Storage with admin-only validated writes.

## Checkout integrity

Client submits variant/item IDs and quantities. Server reloads prices, active state and inventory, validates the discount, calculates totals, and creates the PayMongo checkout session with an internal reference. A verified and deduplicated webhook records trusted payment/order state and adjusts stock atomically where possible. One successful payment creates one correct order and one stock deduction. Only trusted paid state can trigger confirmation; browser closure cannot stop finalization.

## Unresolved schema questions

See DECISIONS.md before M02 and commerce milestones. The user's conceptual list includes payments, but the workbook lists no separate payments table; payment_status and payment provider references are on orders. Do not invent a payments table. Guest order access, checkout-address retention, coupon usage enforcement, stock concurrency and once-only email persistence need a concrete strategy that fits the model, or an approved minimal schema change. No strategy or additional entity/field is approved by this document.

## M02 concrete schema and configuration

Project: Atleteka (vaqkikxksbblgspdeiap), Supabase Postgres 17. Migration 20260916061627_initial_schema creates exactly the 14 entities above. Migration 20260916064417_restrict_platform_helper limits client execution of an existing Supabase event-trigger helper when present. Files and hosted migration history match; future edits require new migrations.

- UUID primary keys use gen_random_uuid(), except profiles uses auth.users.id, inventory uses variant_id, product_categories uses its pair, and webhook_events uses provider_event_id. User references target auth.users. Foreign keys preserve referenced records; no destructive cascades are added.
- Variant title represents the PRD title/options alternative, and price is the sole price source. Product media uses storage_path. No Storage objects/buckets are created. Optional base_price, compare_at_price, reservations, category description, address type/phone and webhook payload_hash are omitted. Address line2 and discount date/usage fields follow the model.
- Money uses exact numeric values, rejects negative/non-finite values and has no currency/rounding default. orders.currency accepts a three-letter uppercase code; this does not implement a currency selector or approve a business currency. Status and discount type are required nonempty text because their business values/transitions are unspecified. Future consuming logic must validate them; no workflow uses them now.
- Orders concretize the PRD payment references as unique nullable stripe_checkout_session_id and stripe_payment_intent_id (Stripe-era names; PayMongo per M08-P01, rename to be proposed in M09). Totals must equal their stored parts. Order items retain all required snapshots, positive quantity and matching line total. A trigger prevents snapshot updates/deletes, including from trusted application roles.
- Unique product/category slugs, SKUs, cart/variant pairs, guest tokens, discount codes and webhook event IDs reject duplicates. Inventory has one nonnegative integer quantity per variant. A cart has exactly one of user_id or guest_token; token issuance and access are unimplemented. Timestamps default on insertion; future trusted mutations must maintain updated_at.
- All 14 tables have RLS enabled and no policies. Public/anonymous/authenticated grants are revoked. Basic schema protection is M02; customer/admin permissions and Auth provisioning are M03. No separate payments entity or new business field was introduced.

The seed contains one synthetic category, three products, five variants, three category joins and five stock rows. Natural-key conflict handling preserves existing records on replay. No users, carts, addresses, orders, coupons, webhook events or media files are seeded. Prices do not establish a merchant currency.

See [database workflow](../supabase/README.md) for commands and [CURRENT.md](CURRENT.md) for verification. Future guest order access, checkout-address retention, coupon accounting and payment/email persistence decisions remain open; M02 default denial exposes none of those workflows.

## M03/M04 current database additions

M03 migration 20260916110141 provisions customer profiles and applies ownership/admin grants and policies. Browser Auth remains unverified; see M03_CHECKPOINT.md. M04 migration 20260916191213 adds only a read-only product_availability view and private.variant_in_stock helper over existing tables, plus the product-images Storage bucket. No business table or field is added. The view exposes variant_id/in_stock for active variants of active products; zero/missing stock is unavailable. It uses security_invoker=true. The restricted helper has an empty search_path and cannot expose counts or mutate inventory.

The merchant confirmed PHP for catalog display on 2026-09-17. Existing seed prices are displayed in PHP; no price data was changed. Checkout calculations remain unresolved for their owning milestone.

## M06 cart database boundary (verified)

Migration 20260921065011_cart_access_and_mutations reuses carts/cart_items without new tables or columns. It closes direct anon/authenticated writes (including the old status/updated_at column grant), keeps owner-only RLS reads, and adds a partial unique active-customer-cart index. Guest ownership compares the SHA-256 hash of a validated x-cart-token request header with existing guest_token; a non-null auth.uid() always selects the separate user cart. Hashes have no client SELECT grant.

Public read_cart() and mutate_cart(operation, variant_id, quantity) are SECURITY INVOKER wrappers over narrowly granted private routines. SQL-standard bodies keep private-schema USAGE denied. Mutations accept add/set/remove, reject nonpositive/noninteger and above-stock quantities, re-check active state, serialize by actor, and reserve/deduct no inventory. Remove requires omitted/null quantity. Read/mutation responses contain current database-derived decimal-string prices, line totals and subtotal; available/quantityValid booleans replace exact counts. Inactive lines expose unavailable placeholders/null prices and are excluded from subtotal. No owner/cart/price arguments are accepted.

Local clean replays, concurrency, hosted SQL/API access tests and migration hash checks passed. Cookie issuance, application integration and end-to-end M06 cart checks are verified in CURRENT.md. Browser fixtures were removed; original seed stock is unchanged.

## M07 checkout database boundary

Approved migration 20260923170726_checkout_calculation adds discounts.redemption_count (integer, not null, default 0, nonnegative). Hosted discounts/orders were both empty before application; no historical usage was assumed. Anon/authenticated clients cannot insert or update this column, including admins through the public API. Existing admin discount-configuration permissions and RLS remain.

Public checkout_quote(coupon_code text default null) is a SECURITY INVOKER wrapper with a bound SQL-standard body. Its private SECURITY DEFINER implementation has an empty search_path and independently requires auth.uid() or a valid guest hash. It reuses private.read_cart() within the statement snapshot, rejects empty/inactive/above-stock carts and fractional-cent prices, validates coupon active state, start <= current statement time < end, fixed/percentage types, value precision/range and global usage_limit against redemption_count. Unsupported configuration fails closed. Codes are trimmed and case-sensitive; one coupon; fixed reduction or percentage rounded half-up to centavos, capped at subtotal.

Response amounts are exact decimal strings in PHP. Tax is included, not added again. shippingTotal/grandTotal are null because the third-party fee is pending. Quotes reserve/consume nothing and create no order. Payment-time redemption accounting is outside M07 and no writer is added. Existing addresses/user_id and ownership RLS support account save/reuse; no new address field or guest row is introduced.

Two clean PG17 replays produced identical schemas; historical-stage regressions, M06 tests and M07 SQL checks passed, including hosted checks. Migration MD5: 69e1ecfd6b2a3f16dae1f43f0975de19. See CURRENT.md for application evidence and limitations.
