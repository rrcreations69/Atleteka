import Link from "next/link";
import { ProductImage } from "./product-image";
import { priceLabel, type CatalogProduct } from "@/lib/catalog/validation";

export function ProductGrid({ products, emptyMessage = "No products are available here yet." }: { products: CatalogProduct[]; emptyMessage?: string }) {
  if (products.length === 0) return <p className="rounded-2xl bg-card px-6 py-12 text-center text-muted-foreground">{emptyMessage}</p>;
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
      {products.map((product) => {
        const status = product.variants.some((variant) => variant.inStock) ? null : product.variants.length ? "Sold out" : "Unavailable";
        return <li key={product.id} className="min-w-0">
          <Link href={`/products/${product.slug}`} className="group block space-y-1.5 rounded-2xl">
            <div className="relative">
              <ProductImage image={product.images[0]} className="motion-safe:transition-opacity group-hover:opacity-90" />
              {status && <span className="absolute left-2.5 top-2.5 rounded-full bg-background px-2.5 py-1 text-xs font-semibold">{status}</span>}
            </div>
            <h2 className="pt-1.5 font-sans text-[0.95rem] font-medium leading-snug [font-variation-settings:normal] group-hover:underline group-hover:underline-offset-4">{product.name}</h2>
          </Link>
          <p className={status ? "text-[0.95rem] font-semibold text-muted-foreground" : "text-[0.95rem] font-semibold"}>{priceLabel(product.variants)}</p>
        </li>;
      })}
    </ul>
  );
}
