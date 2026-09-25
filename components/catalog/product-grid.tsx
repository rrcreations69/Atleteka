import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ProductImage } from "./product-image";
import { priceLabel, type CatalogProduct } from "@/lib/catalog/validation";

export function ProductGrid({ products, emptyMessage = "No products are available here yet." }: { products: CatalogProduct[]; emptyMessage?: string }) {
  if (products.length === 0) return <p className="rounded-xl border border-border px-6 py-12 text-center text-muted-foreground">{emptyMessage}</p>;
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => <li key={product.id}>
        <Card className="h-full">
          <CardContent className="p-4 sm:p-5">
            <Link href={`/products/${product.slug}`} className="block space-y-4 rounded-lg">
              <ProductImage image={product.images[0]} />
              <h2 className="text-lg font-semibold">{product.name}</h2>
            </Link>
            <p className="mt-2 text-sm">{priceLabel(product.variants)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{product.variants.some((variant) => variant.inStock) ? "In stock" : product.variants.length ? "Sold out" : "Unavailable"}</p>
          </CardContent>
        </Card>
      </li>)}
    </ul>
  );
}
