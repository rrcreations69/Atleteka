import Link from "next/link";
import { Container } from "@/components/layout/container";
import Image from "next/image";
import { Faq } from "@/components/home/landing-sections";
import { ColorHero, type HeroSlide } from "@/components/home/color-hero";
import { ProductGrid } from "@/components/catalog/product-grid";
import { getCategories, getProducts } from "@/lib/catalog/data";
import { PAGE_SIZE, catalogQuerySchema, priceLabel, type CatalogCategory, type CatalogImage, type CatalogProduct } from "@/lib/catalog/validation";
import { brand } from "@/lib/brand";

// Catalog content refreshes at most once a minute.
export const revalidate = 60;

const LEAD = ["women", "men"];
const firstQuery = catalogQuerySchema.parse({});
const pill = "inline-flex min-h-12 items-center rounded-full bg-black px-7 text-sm font-semibold text-white group-hover:bg-[#2d2d2d]";

type Covered = CatalogCategory & { cover?: CatalogImage };

// Categories have no images, so each cover is a product photo: prefer products specific to the
// category (fewest category memberships), then the signature (highest-priced) piece. Photos are
// not repeated, and the Women/Men tiles avoid two products from the same clothing type.
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

// Featured hero: the highest-priced in-stock pieces with a photo, one per color mood.
function featuredSlides(products: CatalogProduct[]): HeroSlide[] {
  const top = (product: CatalogProduct) => Math.max(...product.variants.map((variant) => variant.price));
  return products.filter((product) => product.images.length > 0 && product.variants.some((variant) => variant.inStock))
    .sort((a, b) => top(b) - top(a)).slice(0, brand.heroMoods.length)
    .map((product) => ({
      id: product.id, slug: product.slug, name: product.name, price: priceLabel(product.variants),
      // First sentence of the description keeps the hero copy short.
      blurb: firstSentence(product.description),
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
  return (
    <div className="flex-1 pb-16 sm:pb-24">
      <h1 className="sr-only">{brand.name}: {brand.tagline}</h1>
      <ColorHero slides={slides} />

      <Container className="mt-12 sm:mt-16">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-2xl">Shop the collection</h2>
          <Link href="/shop" className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold underline underline-offset-4">View all</Link>
        </div>
        <ProductGrid products={products} headingLevel={3} />
      </Container>

      {lead.length > 0 && <Container className="mt-14 sm:mt-20">
        <section aria-label="Shop by department" className={"grid gap-3 " + (lead.length > 1 ? "sm:grid-cols-2" : "")}>
          {lead.map((category) => <Link key={category.id} href={`/categories/${category.slug}`}
            className="group relative block aspect-[4/5] overflow-hidden bg-card motion-safe:transition-colors motion-safe:duration-700">
            {category.cover && <span className="absolute inset-x-[10%] bottom-[30%] top-[6%]"><Image src={category.cover.url} alt="" fill sizes="(min-width: 640px) 40vw, 80vw" className="object-contain" /></span>}
            <span className="absolute bottom-7 left-6 sm:bottom-9 sm:left-9">
              <span className="font-display block text-[clamp(3rem,6vw,5.5rem)] font-medium uppercase leading-[0.9]">{category.name}</span>
              <span className={pill + " mt-4"}>Shop {category.name.toLowerCase()}</span>
            </span>
          </Link>)}
        </section>
      </Container>}

      {others.length > 0 && <Container className="mt-14 sm:mt-20">
        <h2 className="mb-5 text-2xl">Shop by category</h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {others.map((category) => <li key={category.id}>
            <Link href={`/categories/${category.slug}`}
              className="group relative block aspect-[3/4] overflow-hidden bg-accent motion-safe:transition-colors motion-safe:duration-700">
              {category.cover && <span className="absolute inset-x-[12%] bottom-[36%] top-[8%]"><Image src={category.cover.url} alt="" fill sizes="(min-width: 1024px) 20vw, 40vw" className="object-contain" /></span>}
              <span className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5">
                <span className="font-display block text-2xl font-medium uppercase leading-none sm:text-3xl">{category.name}</span>
                <span className="mt-3 inline-flex min-h-10 items-center rounded-full bg-black px-5 text-xs font-semibold text-white group-hover:bg-[#2d2d2d]">Shop {category.name.toLowerCase()}</span>
              </span>
            </Link>
          </li>)}
        </ul>
      </Container>}

      <Faq />
    </div>
  );
}
