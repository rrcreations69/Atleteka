import Image from "next/image";
import Link from "next/link";
import { priceLabel, type CatalogProduct } from "@/lib/catalog/validation";

// Product card on the active mood's tile tint (D-DESIGN-05); hovering or focusing shows the second photo.
// Names are h2 on catalog pages (under the page h1) and h3 inside a section.
export function ProductCard({ product, headingLevel = 3 }: { product: CatalogProduct; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const [front, back] = product.images;
  const status = product.variants.some((variant) => variant.inStock) ? null : product.variants.length ? "Sold out" : "Unavailable";
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-photo motion-safe:transition-colors motion-safe:duration-700">
        {front ? <>
          <Image src={front.url} alt={front.alt} fill sizes="(min-width: 1024px) 25vw, 50vw"
            className={"object-contain p-[11%]" + (back ? " motion-safe:transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0" : "")} />
          {back && <Image src={back.url} alt="" aria-hidden="true" fill sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-contain p-[11%] opacity-0 motion-safe:transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />}
        </> : <span className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">Photo coming soon</span>}
        {status && <span className="absolute left-3 top-3 rounded-full bg-field px-3 py-1 text-xs font-semibold">{status}</span>}
      </div>
      <Heading className="mt-3 text-sm font-semibold leading-snug tracking-normal group-hover:underline group-hover:underline-offset-4">{product.name}</Heading>
      <p className={status ? "mt-1 text-sm text-muted-foreground" : "mt-1 text-sm"}>{priceLabel(product.variants)}</p>
    </Link>
  );
}
