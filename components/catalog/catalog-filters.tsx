import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CatalogCategory, CatalogQuery } from "@/lib/catalog/validation";

export function CatalogFilters({ base, query, categories, fixedCategory }: {
  base: string; query: CatalogQuery; categories: CatalogCategory[]; fixedCategory: boolean;
}) {
  const selectClass = "min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base";
  return (
    <form action={base} method="get" role="search" aria-label="Search and filter products" className="my-6 grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="min-w-0 space-y-2">
        <Label htmlFor="catalog-query">Search product names</Label>
        <Input id="catalog-query" name="q" type="search" maxLength={100} defaultValue={query.q} />
      </div>
      {!fixedCategory && <div className="min-w-0 space-y-2">
        <Label htmlFor="catalog-category">Category</Label>
        <select id="catalog-category" name="category" defaultValue={query.category} className={selectClass}>
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
        </select>
      </div>}
      <div className="min-w-0 space-y-2">
        <Label htmlFor="catalog-availability">Availability</Label>
        <select id="catalog-availability" name="availability" defaultValue={query.availability} className={selectClass}>
          <option value="all">All availability</option>
          <option value="in-stock">In stock</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-3">
        <Button type="submit">Apply search and filters</Button>
        <Link href={base} className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Clear search and filters</Link>
      </div>
    </form>
  );
}
