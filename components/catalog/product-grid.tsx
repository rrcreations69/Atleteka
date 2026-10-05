import { ProductCard } from "./product-card";
import type { CatalogProduct } from "@/lib/catalog/validation";

// Product names are h2 on catalog pages (under the page h1) and h3 inside a home page section.
export function ProductGrid({ products, emptyMessage = "No products are available here yet.", headingLevel = 2 }: { products: CatalogProduct[]; emptyMessage?: string; headingLevel?: 2 | 3 }) {
  if (products.length === 0) return <p className="bg-card px-6 py-12 text-center text-muted-foreground">{emptyMessage}</p>;
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-4">
      {products.map((product) => <li key={product.id} className="min-w-0"><ProductCard product={product} headingLevel={headingLevel} /></li>)}
    </ul>
  );
}
