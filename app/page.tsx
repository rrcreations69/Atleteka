import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ProductGrid } from "@/components/catalog/product-grid";
import { buttonVariants } from "@/components/ui/button";
import { getCategories, getProducts } from "@/lib/catalog/data";
import { catalogQuerySchema } from "@/lib/catalog/validation";

// Catalog content refreshes at most once a minute.
export const revalidate = 60;

const TILE_TONES = ["bg-[#dcd3bf]", "bg-[#d8dcc6]", "bg-[#ead3c5]", "bg-sand"];

export default async function HomePage() {
  const [categories, listing] = await Promise.all([getCategories(), getProducts(catalogQuerySchema.parse({}))]);
  const women = categories.find((category) => category.slug === "women");
  const men = categories.find((category) => category.slug === "men");
  const products = listing?.products.slice(0, 8) ?? [];
  return (
    <>
      <Container className="pt-2 sm:pt-6">
        <section className="relative overflow-hidden rounded-3xl bg-sand px-6 py-14 sm:px-12 sm:py-20 lg:py-28">
          <div aria-hidden="true" className="absolute -right-24 -top-24 size-80 rounded-full bg-[#ead3c5] sm:size-[28rem]" />
          <div aria-hidden="true" className="absolute -bottom-32 right-24 size-64 rounded-full bg-[#d8dcc6] sm:size-80" />
          <div className="relative max-w-xl">
            <h1 className="text-display">Easy pieces for every&nbsp;day.</h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">Comfortable, well-made clothing for women and men, delivered across the Philippines.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {women || men ? <>
                {women && <Link href={`/categories/${women.slug}`} className={buttonVariants()}>Shop women</Link>}
                {men && <Link href={`/categories/${men.slug}`} className={buttonVariants({ variant: women ? "outline" : "default" })}>Shop men</Link>}
              </> : <Link href="/shop" className={buttonVariants()}>Shop the collection</Link>}
            </div>
          </div>
        </section>
      </Container>

      {categories.length > 0 && <Container className="mt-14">
        <h2 className="mb-5 text-3xl">Shop by category</h2>
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {categories.slice(0, 8).map((category, index) => <li key={category.id}>
            <Link href={`/categories/${category.slug}`} className={"group flex aspect-[4/3] items-end rounded-2xl p-4 " + TILE_TONES[index % TILE_TONES.length]}>
              <span className="rounded-full bg-background px-4 py-2 text-[0.95rem] font-semibold group-hover:underline group-hover:underline-offset-4">{category.name}</span>
            </Link>
          </li>)}
        </ul>
      </Container>}

      <Container className="mt-14">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="text-3xl">Shop the collection</h2>
          <Link href="/shop" className="inline-flex min-h-11 items-center text-[0.95rem] font-semibold underline-offset-4 hover:underline">See all</Link>
        </div>
        <ProductGrid products={products} />
      </Container>

      <Container className="mt-14">
        <ul className="grid gap-3 sm:grid-cols-3 sm:gap-5">
          <li className="rounded-2xl bg-card p-6"><h2 className="text-xl">Pay your way</h2><p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">Card, QR Ph and e-wallets, secured by PayMongo.</p></li>
          <li className="rounded-2xl bg-card p-6"><h2 className="text-xl">Delivered nationwide</h2><p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">You pay the courier for shipping when your order arrives.</p></li>
          <li className="rounded-2xl bg-card p-6"><h2 className="text-xl">No account needed</h2><p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">Check out as a guest. Prices include tax.</p></li>
        </ul>
      </Container>
    </>
  );
}
