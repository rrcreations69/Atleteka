# Atleteka

PRD-driven single-store e-commerce application. **M05: Search & filters** is complete and verified within its scope. M00-M02 are verified; M03 has an unresolved browser-auth verification failure recorded in [M03_CHECKPOINT.md](docs/M03_CHECKPOINT.md). See [CURRENT.md](docs/CURRENT.md) for current acceptance results.

## Run locally

Use Node.js 24.x and npm 11.x with the included lockfile.

1. Run `npm ci`.
2. Copy .env.example to .env.local and supply NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and NEXT_PUBLIC_APP_URL. The ANON_KEY variable accepts a current Supabase publishable key.
3. Apply the reviewed Supabase migrations using the [database workflow](supabase/README.md).
4. Run `npm run dev` and open [localhost:3000/shop](http://localhost:3000/shop).

No service-role key is required for catalog reads. Keep real environment files out of Git. For production-mode local verification, run `npm run build` then `npm start`.

## Current catalog

- /shop: active products, category links and server pagination (12 products per page).
- /categories/[slug]: products in an active category.
- /products/[slug]: description, image gallery, active variant selection, PHP prices and stock state.
- Missing/broken images, empty results, loading, errors and unavailable URLs have explicit states.
- Online ordering is not implemented in M04. The purchase control stays disabled; there is no cart mutation.
- /search, /shop and category pages provide literal product-name search and in-stock filtering. /search and /shop also provide a category selector. GET parameters preserve state across navigation.
- Checkout, admin management and uploads remain in their owning milestones.

The merchant selected PHP as the single catalog currency. Prices come from active variants. Public availability is a boolean derived from authoritative inventory; exact counts remain private.

## Media

Catalog image rows use a path inside the public `product-images` Supabase bucket. Supply alt_text and sort_order on product_images. No merchant photographs are included in the development seed; those products show an image fallback. M04 creates the read bucket but no application upload or storage-write policy. Authorized media upload workflows belong to M11.

## Quality checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Node's built-in test runner exercises validation/catalog presentation rules without a new test dependency. Transactional database tests cover permissions and derived availability. Local browser evidence uses bundled Playwright/Chrome, not an application package. See CURRENT.md for results and limitations.

## Stack and conventions

Next.js App Router, strict TypeScript, Tailwind, existing shadcn/ui primitives, Supabase and Zod. Direct package versions are pinned. M04/M05 add no dependencies.

- app/: routes and shared layout; catalog routes live in the (catalog) group.
- components/ui and components/layout: reused primitives and shell.
- components/catalog: product listing, gallery, images and variant selection.
- lib/catalog: Zod boundaries, server queries and presentation helpers.
- lib/supabase/public.ts: anonymous server catalog client, independent of any admin session.
- lib/auth and lib/supabase/server.ts: M03 auth implementation; see its unresolved checkpoint.
- supabase/: migration source of truth, development seed and SQL tests.
- docs/PRD.xlsx: unchanged primary product specification.

Prefer Server Components. Gallery/variant/image-error behavior uses small Client Components. Never trust client prices, stock, role or ownership. Do not add features outside the authorized milestone.

ESLint 9.39.5 remains the compatible major for the installed Next.js plugin peers, with its pre-existing maintenance limitation recorded in DECISIONS.md. Next.js agentRules is disabled so AGENTS.md stays project-owned.
