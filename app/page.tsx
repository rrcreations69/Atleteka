import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ProductGrid } from "@/components/catalog/product-grid";
import { ProductImage } from "@/components/catalog/product-image";
import { buttonVariants } from "@/components/ui/button";
import { BrandStatement, ClosingCta, Faq, HowItWorks, WhyAtleteka, type ShopLink } from "@/components/home/landing-sections";
import { getCategories, getProducts } from "@/lib/catalog/data";
import { catalogQuerySchema, priceLabel, type CatalogCategory, type CatalogImage, type CatalogProduct } from "@/lib/catalog/validation";

// Catalog content refreshes at most once a minute.
export const revalidate = 60;

const LEAD = ["women", "men"];
const firstQuery = catalogQuerySchema.parse({});

type Covered = CatalogCategory & { cover?: CatalogImage };

// Categories have no images, so each cover is a product photo: prefer products specific to the
// category (fewest category memberships), then the signature (highest-priced) piece. Photos are
// not repeated, and the Women/Men heroes avoid two products from the same clothing type.
async function withCovers(categories: CatalogCategory[]): Promise<Covered[]> {
  const listings = await Promise.all(categories.map((category) => getProducts(firstQuery, category.id)));
  const groups = new Map<string, string[]>();
  listings.forEach((listing, index) => {
    for (const product of listing?.products ?? []) groups.set(product.id, [...(groups.get(product.id) ?? []), categories[index].slug]);
  });
  const used = new Set<string>();
  const usedTypes = new Set<string>();
  return categories.map((category, index) => {
    const lead = LEAD.includes(category.slug);
    const types = (id: string) => (groups.get(id) ?? []).filter((slug) => !LEAD.includes(slug));
    const candidates = (listings[index]?.products ?? []).filter((product) => product.images.length > 0)
      .map((product) => ({ product, top: Math.max(0, ...product.variants.map((variant) => variant.price)) }))
      .sort((a, b) => (groups.get(a.product.id)?.length ?? 0) - (groups.get(b.product.id)?.length ?? 0) || b.top - a.top);
    const pick = (lead ? candidates.find(({ product }) => !used.has(product.id) && !types(product.id).some((slug) => usedTypes.has(slug))) : undefined)
      ?? candidates.find(({ product }) => !used.has(product.id)) ?? candidates[0];
    if (pick) {
      used.add(pick.product.id);
      if (lead) for (const slug of types(pick.product.id)) usedTypes.add(slug);
    }
    return { ...category, cover: pick?.product.images[0] };
  });
}

// Spotlight: the highest-priced in-stock product with a photo that the hero tiles don't already show.
function pickSpotlight(products: CatalogProduct[], shown: Set<string>) {
  return products.filter((product) => product.images.length > 0 && product.variants.some((variant) => variant.inStock) && !shown.has(product.images[0].id))
    .sort((a, b) => Math.max(...b.variants.map((variant) => variant.price)) - Math.max(...a.variants.map((variant) => variant.price)))[0];
}

export default async function HomePage() {
  const [categories, listing] = await Promise.all([getCategories(), getProducts(firstQuery)]);
  const ordered = [...LEAD.map((slug) => categories.find((category) => category.slug === slug)).filter((category) => category !== undefined),
    ...categories.filter((category) => !LEAD.includes(category.slug))].slice(0, 8);
  const covered = await withCovers(ordered);
  const lead = covered.filter((category) => LEAD.includes(category.slug));
  const others = covered.filter((category) => !LEAD.includes(category.slug));
  const products = listing?.products.slice(0, 8) ?? [];
  const spotlight = pickSpotlight(listing?.products ?? [], new Set(lead.flatMap((category) => category.cover ? [category.cover.id] : [])));
  const shopLinks: ShopLink[] = lead.length > 0
    ? lead.map((category) => ({ href: `/categories/${category.slug}`, label: `Shop ${category.name.toLowerCase()}` }))
    : [{ href: "/shop", label: "Shop the collection" }];
  return (
    <>
      {lead.length > 0 ? <section aria-labelledby="home-heading" className={"grid " + (lead.length > 1 ? "sm:grid-cols-2" : "")}>
        <h1 id="home-heading" className="sr-only">Atleteka: everyday clothing for women and men</h1>
        {lead.map((category) => <Link key={category.id} href={`/categories/${category.slug}`} className="group relative block bg-foreground">
          <ProductImage image={category.cover} sizes="(min-width: 640px) 50vw, 100vw" className="aspect-[4/5] opacity-90 group-hover:opacity-100 sm:aspect-[3/4] lg:aspect-[4/5] lg:max-h-[46rem]" />
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#181a2f]/75 to-transparent" />
          <span className="absolute bottom-6 left-5 text-white sm:bottom-9 sm:left-9">
            <span className="block text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">{category.name}</span>
            <span className={buttonVariants({ variant: "inverse", className: "pointer-events-none mt-4" })}>Shop {category.name.toLowerCase()}</span>
          </span>
        </Link>)}
      </section> : <section className="bg-navy text-background [--ring:var(--apricot)]">
        <Container className="py-20 sm:py-28">
          <p className="eyebrow text-xs text-apricot">New season</p>
          <h1 className="mt-4 max-w-2xl text-display">Everyday clothing for women and men.</h1>
          <Link href="/shop" className={buttonVariants({ variant: "inverse", className: "mt-8" })}>Shop the collection</Link>
        </Container>
      </section>}

      <BrandStatement />

      <Container className="mt-16 sm:mt-24">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-xs text-primary">The collection</p>
            <h2 className="mt-2 text-2xl sm:text-3xl">Pieces for every day.</h2>
          </div>
          <Link href="/shop" className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold underline underline-offset-4">View all</Link>
        </div>
        <ProductGrid products={products} />
      </Container>

      {spotlight && <section aria-labelledby="spotlight-heading">
        <Container className="mt-16 grid items-center gap-8 sm:mt-24 lg:grid-cols-2 lg:gap-16">
          <Link href={`/products/${spotlight.slug}`} className="block" tabIndex={-1} aria-hidden="true">
            <ProductImage image={spotlight.images[0]} sizes="(min-width: 1024px) 50vw, 100vw" />
          </Link>
          <div>
            <p className="eyebrow text-xs text-primary">Spotlight</p>
            <h2 id="spotlight-heading" className="mt-3 text-3xl sm:text-4xl">{spotlight.name}</h2>
            <p className="mt-3 text-lg font-semibold">{priceLabel(spotlight.variants)}</p>
            {spotlight.description && <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">{spotlight.description.split("\n")[0]}</p>}
            <Link href={`/products/${spotlight.slug}`} className={buttonVariants({ className: "mt-8" })}>Shop now</Link>
          </div>
        </Container>
      </section>}

      {others.length > 0 && <Container className="mt-16 sm:mt-24">
        <p className="eyebrow text-xs text-primary">Categories</p>
        <h2 className="mb-6 mt-2 text-2xl sm:text-3xl">Shop by category.</h2>
        <ul className="grid grid-cols-2 gap-x-2 gap-y-6 sm:gap-x-3 lg:grid-cols-4">
          {others.map((category) => <li key={category.id}>
            <Link href={`/categories/${category.slug}`} className="group block">
              <ProductImage image={category.cover} shape="square" sizes="(min-width: 1024px) 25vw, 50vw" />
              <span className="mt-2.5 block text-sm font-semibold group-hover:underline group-hover:underline-offset-4">{category.name} <span aria-hidden="true">→</span></span>
            </Link>
          </li>)}
        </ul>
      </Container>}

      <WhyAtleteka />
      <HowItWorks />
      <Faq />
      <ClosingCta links={shopLinks} />
    </>
  );
}
