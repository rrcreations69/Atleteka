import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SORT_OPTIONS, type CatalogCategory, type CatalogQuery } from "@/lib/catalog/validation";

// A slim GET form so filtering works without JavaScript. Labels are visually hidden; each control
// still has one, and the selects' first options ("All categories", "Any availability", "Name A–Z") read as labels.
export function CatalogFilters({ base, query, categories, fixedCategory }: {
  base: string; query: CatalogQuery; categories: CatalogCategory[]; fixedCategory: boolean;
}) {
  const selectClass = "min-h-12 w-full min-w-0 rounded-sm border border-input bg-field px-3 py-2 text-base lg:text-sm";
  return (
    <form action={base} method="get" role="search" aria-label="Search and filter products"
      className="grid grid-cols-2 gap-2 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_11rem_auto]">
      <div className="relative col-span-2 min-w-0 lg:col-span-1">
        <label htmlFor="catalog-query" className="sr-only">Search product names</label>
        <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <Input id="catalog-query" name="q" type="search" maxLength={100} defaultValue={query.q} placeholder="Search products" className="pl-11 lg:text-sm" />
      </div>
      {!fixedCategory && <div className="min-w-0">
        <label htmlFor="catalog-category" className="sr-only">Category</label>
        <select id="catalog-category" name="category" defaultValue={query.category} className={selectClass}>
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
        </select>
      </div>}
      <div className="min-w-0">
        <label htmlFor="catalog-availability" className="sr-only">Availability</label>
        <select id="catalog-availability" name="availability" defaultValue={query.availability} className={selectClass}>
          <option value="all">Any availability</option>
          <option value="in-stock">In stock only</option>
        </select>
      </div>
      <div className={fixedCategory ? "min-w-0 lg:col-span-2" : "min-w-0"}>
        <label htmlFor="catalog-sort" className="sr-only">Sort by</label>
        <select id="catalog-sort" name="sort" defaultValue={query.sort} className={selectClass}>
          {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      <Button type="submit" variant="ink" className={fixedCategory ? "col-span-2 lg:col-span-1" : undefined}>Apply</Button>
    </form>
  );
}
