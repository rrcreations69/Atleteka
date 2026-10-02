import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ProductGrid } from "@/components/catalog/product-grid";
import { ProductImage } from "@/components/catalog/product-image";
import { buttonVariants } from "@/components/ui/button";
import { BrandStatement, ClosingCta, Faq, HowItWorks, WhyAtleteka, type ShopLink } from "@/components/home/landing-sections";
import { FeaturedHero, type HeroSlide } from "@/components/home/featured-hero";
import { getCategories, getProducts } from "@/lib/catalog/data";
import { PAGE_SIZE, catalogQuerySchema, priceLabel, type CatalogCategory, type CatalogImage, type CatalogProduct } from "@/lib/catalog/validation";

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

function firstSentence(text: string) {
  const paragraph = text.split("\n")[0].trim();
  return (paragraph.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? paragraph).trim();
}

// Featured hero: the five highest-priced in-stock pieces with a photo.
function featuredSlides(products: CatalogProduct[]): HeroSlide[] {
  const top = (product: CatalogProduct) => Math.max(...product.variants.map((variant) => variant.price));
  return products.filter((product) => product.images.length > 0 && product.variants.some((variant) => variant.inStock))
    .sort((a, b) => top(b) - top(a)).slice(0, 5)
    .map((product) => ({
      id: product.id, slug: product.slug, name: product.name, price: priceLabel(product.variants),
      // First sentence of the description keeps the hero copy short.
      blurb: firstSentence(product.description),
      sizes: product.variants.map((variant) => ({ title: variant.title, inStock: variant.inStock })),
      image: product.images[0],
    }));
}

export default async function HomePage() {
  const [categories, listing] = await Promise.all([getCategories(), getProducts(firstQuery)]);
  // The hero considers the whole active catalog, not only the first page.
  const pages = Math.ceil((listing?.total ?? 0) / PAGE_SIZE);
  const rest = pages > 1 ? await Promise.all(Array.from({ length: Math.min(pages, 5) - 1 }, (_, i) => getProducts(catalogQuerySchema.parse({ page: i + 2 })))) : [];
  const catalog = [...(listing?.products ?? []), ...rest.flatMap((page) => page?.products ?? [])];
  const ordered = [...LEAD.map((slug) => categories.find((category) => category.slug === slug)).filter((category) => category !== undefined),
    ...categories.filter((category) => !LEAD.includes(category.slug))].slice(0, 8);
  const covered = await withCovers(ordered);
  const lead = covered.filter((category) => LEAD.includes(category.slug));
  const others = covered.filter((category) => !LEAD.includes(category.slug));
  const products = listing?.products.slice(0, 8) ?? [];
  const slides = featuredSlides(catalog);
  const shopLinks: ShopLink[] = lead.length > 0
    ? lead.map((category) => ({ href: `/categories/${category.slug}`, label: `Shop ${category.name.toLowerCase()}` }))
    : [{ href: "/shop", label: "Shop the collection" }];
  return (
    <>
      <h1 className="sr-only">Atleteka: everyday clothing for women and men</h1>
      <FeaturedHero slides={slides} />
      {lead.length > 0 ? <section aria-label="Shop by department" className={"grid " + (lead.length > 1 ? "sm:grid-cols-2" : "")}>
        {lead.map((category) => <Link key={category.id} href={`/categories/${category.slug}`} className="group relative block bg-foreground">
          <ProductImage image={category.cover} sizes="(min-width: 640px) 50vw, 100vw" className="aspect-[4/3] opacity-90 group-hover:opacity-100 lg:aspect-[16/10]" />
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#181a2f]/75 to-transparent" />
          <span className="absolute bottom-6 left-5 text-white sm:bottom-9 sm:left-9">
            <span className="block text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">{category.name}</span>
            <span className={buttonVariants({ variant: "inverse", className: "pointer-events-none mt-4" })}>Shop {category.name.toLowerCase()}</span>
          </span>
        </Link>)}
      </section> : null}

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
