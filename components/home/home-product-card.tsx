import Image from "next/image";
import Link from "next/link";
import { priceLabel, type CatalogProduct } from "@/lib/catalog/validation";

// Home page product card on the active mood's tile tint; hovering or focusing shows the second photo.
export function HomeProductCard({ product }: { product: CatalogProduct }) {
  const [front, back] = product.images;
  const status = product.variants.some((variant) => variant.inStock) ? null : product.variants.length ? "Sold out" : "Unavailable";
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-[var(--home-tile)] motion-safe:transition-colors motion-safe:duration-700">
        {front ? <>
          <Image src={front.url} alt={front.alt} fill sizes="(min-width: 1024px) 25vw, 50vw"
            className={"object-contain p-[11%]" + (back ? " motion-safe:transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0" : "")} />
          {back && <Image src={back.url} alt="" aria-hidden="true" fill sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-contain p-[11%] opacity-0 motion-safe:transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />}
        </> : <span className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">Photo coming soon</span>}
        {status && <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold">{status}</span>}
      </div>
      <h3 className="mt-3 text-sm font-semibold leading-snug tracking-normal group-hover:underline group-hover:underline-offset-4">{product.name}</h3>
      <p className={status ? "mt-1 text-sm text-muted-foreground" : "mt-1 text-sm"}>{priceLabel(product.variants)}</p>
    </Link>
  );
}
