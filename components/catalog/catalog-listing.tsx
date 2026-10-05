import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { getCategories, getProducts } from "@/lib/catalog/data";
import { PAGE_SIZE, catalogHref, type CatalogCategory, type CatalogQuery } from "@/lib/catalog/validation";
import { ProductGrid } from "./product-grid";
import { CatalogFilters } from "./catalog-filters";

export async function CatalogListing({ query, category, search = false }: {
  query: CatalogQuery; category?: CatalogCategory; search?: boolean;
}) {
  const categories = await getCategories();
  const selectedCategory = category ?? (query.category ? categories.find((item) => item.slug === query.category) : undefined);
  if (query.category && (!selectedCategory || (category && query.category !== category.slug))) notFound();
  const listing = await getProducts(query, selectedCategory?.id);
  if (!listing) notFound();
  const { products, total } = listing;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (query.page > pages) notFound();
  const base = category ? `/categories/${category.slug}` : search ? "/search" : "/shop";
  const linkQuery = { ...query, category: "", page: 1 };
  const filtered = !!(query.q || query.category || query.availability === "in-stock");
  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl">{category?.name ?? (search ? "Search" : "Shop")}</h1>
      {categories.length > 0 && <nav aria-label="Browse categories" className="-mx-4 my-6 flex gap-x-6 overflow-x-auto px-4 shadow-[inset_0_-1px_0_var(--border)] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        <Link href={catalogHref(search ? "/search" : "/shop", linkQuery)} aria-current={!selectedCategory ? "page" : undefined} className="eyebrow inline-flex min-h-11 shrink-0 items-center border-b-2 border-transparent text-xs text-muted-foreground hover:text-foreground aria-[current=page]:border-foreground aria-[current=page]:text-foreground">All products</Link>
        {categories.map((item) => <Link key={item.id} href={catalogHref(`/categories/${item.slug}`, linkQuery)} aria-current={item.id === selectedCategory?.id ? "page" : undefined} className="eyebrow inline-flex min-h-11 shrink-0 items-center border-b-2 border-transparent text-xs text-muted-foreground hover:text-foreground aria-[current=page]:border-foreground aria-[current=page]:text-foreground">{item.name}</Link>)}
      </nav>}
      <CatalogFilters key={catalogHref(base, query)} base={base} query={query} categories={categories} fixedCategory={!!category} />
      <div className="mb-6 mt-4 flex min-h-11 flex-wrap items-center justify-between gap-x-4 text-sm">
        <p className="text-muted-foreground" role="status">{total} {total === 1 ? "product" : "products"}{query.q ? <> for <span className="font-semibold text-foreground">&ldquo;{query.q}&rdquo;</span></> : null}</p>
        {filtered && <Link href={base} className="inline-flex min-h-11 items-center underline underline-offset-4">Clear filters</Link>}
      </div>
      <ProductGrid products={products} emptyMessage={filtered ? "No products match your search or filters." : undefined} />
      {pages > 1 && <nav aria-label="Product pages" className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-4 text-sm">
        {query.page > 1 ? <Link className="inline-flex min-h-11 items-center underline" href={catalogHref(base, { ...query, page: query.page - 1 })}>Previous</Link> : <span />}
        <span>Page {query.page} of {pages}</span>
        {query.page < pages ? <Link className="inline-flex min-h-11 items-center underline" href={catalogHref(base, { ...query, page: query.page + 1 })}>Next</Link> : <span />}
      </nav>}
    </Container>
  );
}
