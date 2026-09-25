# Supabase database workflow

Project: **Atleteka**, ref `vaqkikxksbblgspdeiap`, ap-southeast-1, PostgreSQL 17. Supabase MCP is connected. Public catalog reads use the public project URL/key; no service-role key is stored.

## Migration source of truth

- 20260916061627_initial_schema.sql: 14 PRD tables, integrity constraints, immutable order snapshots and default-deny RLS.
- 20260916064417_restrict_platform_helper.sql: restrict client execution of the existing platform automatic-RLS helper.
- 20260916110141_auth_profiles_and_rls.sql: M03 customer profiles, role/ownership grants and RLS.
- 20260916191213_catalog_availability_and_media.sql: M04 read-only availability projection and public catalog media bucket.
- 20260923170726_checkout_calculation.sql: protected coupon usage counter and read-only owner-checked PHP merchandise quote. Shipping/final total remain pending.
- 20260921065011_cart_access_and_mutations.sql: M06 owner-bound cart RPCs, guest hash RLS, closed direct writes, atomic stock validation and active-customer-cart uniqueness.

Files match the hosted migration versions. Never edit or reapply an applied migration. Create future migrations with `supabase migration new <name>`, review SQL and apply through the authorized MCP/CLI workflow.

## Local database

A full local Supabase stack requires Supabase CLI and a Docker-compatible runtime:

```sh
supabase start
supabase db reset --local
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -W -v ON_ERROR_STOP=1 -f supabase/tests/m03_auth.sql
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -W -v ON_ERROR_STOP=1 -f supabase/tests/m04_catalog.sql
```

Use only a disposable local reset, never a linked/remote reset. This host used isolated portable PostgreSQL 17 for clean replays, with small platform Auth/Storage stubs, and hosted Supabase for actual platform permission tests. Docker startup was not run.

The historical m02_schema.sql/m02_seed.sql tests target the M02 state **before** M03 permissions. Run those after the first two migrations in a staged replay, not after the full current migration chain. Run m03_auth.sql after M03 and before M06, since M06 intentionally closes its earlier direct-cart-write grants. M04/M06 tests run after the full chain and roll back their fixtures.

## Hosted workflow

```sh
supabase login
supabase link --project-ref vaqkikxksbblgspdeiap
supabase db push --linked --dry-run
```

Inspect the pending SQL before an authorized push, or apply the reviewed migration through MCP. Keep the local filename aligned to recorded hosted history and verify the SQL hash. Never put privileged credentials into source or chat.

## Catalog and permissions

The seed remains the M02 synthetic category, three products, five variants and inventory examples. ON CONFLICT DO NOTHING preserves existing data. No merchant media or customer data is seeded.

- Public catalog reads are limited to active products/categories/variants.
- product_availability exposes only variant_id and in_stock, through a security-invoker view and a restricted private helper. It contains no stored business data.
- Exact inventory counts and adjustments remain admin-only.
- product-images is a public catalog-only bucket; M04 creates no client storage-write policies or upload UI.
- Customer profiles/addresses/carts/orders use ownership policies; roles cannot be edited by clients.
- Orders/payment fields and webhook events remain closed to client writes. Future fulfillment/guest/payment workflows need their own rules.
- The application always uses an anonymous client for storefront reads, even when an admin has a session.

M03 browser Auth verification is incomplete; SQL access results do not establish end-to-end login correctness. See [M03_CHECKPOINT.md](../docs/M03_CHECKPOINT.md). Current milestone evidence is in [CURRENT.md](../docs/CURRENT.md).

M06 local verification: two clean PostgreSQL replays plus supabase/tests/m06_cart.sql, then hosted SQL/RPC and concurrency checks. The CLI is absent on this host; the approved MCP migration was applied and the local filename uses its returned history version. Local/hosted SQL hashes match. The guest cookie and application cart integration are verified in docs/M06_CHECKPOINT.md.
