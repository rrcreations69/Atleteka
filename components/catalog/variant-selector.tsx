"use client";

import { useId, useState } from "react";
import { CartForm } from "@/components/cart/cart-form";
import { formatPrice, priceLabel, type CatalogVariant } from "@/lib/catalog/validation";

export function VariantSelector({ variants, productName }: { variants: CatalogVariant[]; productName: string }) {
  const [selectedId, setSelectedId] = useState(variants.length === 1 ? variants[0].id : "");
  const selected = variants.find((variant) => variant.id === selectedId);
  const group = useId();
  return (
    <div className="space-y-6">
      <div id="variant-status" aria-live="polite" aria-atomic="true" className="space-y-1">
        <p className="text-2xl font-semibold">{selected ? formatPrice(selected.price) : priceLabel(variants)}</p>
        <p className="text-sm text-muted-foreground">Tax included · Shipping paid to the courier on delivery</p>
      </div>
      {variants.length > 0 && <fieldset className="space-y-3" aria-describedby="variant-availability">
        <div className="flex items-baseline justify-between gap-4">
          <legend className="text-[0.95rem] font-semibold">{selected ? `Option: ${selected.title}` : "Choose an option"}</legend>
          <p id="variant-availability" className={selected?.inStock ? "text-sm font-semibold text-success" : "text-sm text-muted-foreground"}>
            {selected ? selected.inStock ? "In stock" : "Sold out" : "Select an option to see availability."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => <div key={variant.id}>
            <input type="radio" id={`${group}-${variant.id}`} name={group} value={variant.id} checked={selectedId === variant.id}
              onChange={() => setSelectedId(variant.id)} className="peer sr-only" />
            <label htmlFor={`${group}-${variant.id}`} className={"inline-flex min-h-12 min-w-14 cursor-pointer items-center justify-center rounded-full border border-input bg-field px-4 text-sm font-semibold peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-ring" + (variant.inStock ? "" : " text-muted-foreground line-through")}>
              {variant.title}<span className="sr-only">{variant.inStock ? "" : " (sold out)"}</span>
            </label>
          </div>)}
        </div>
      </fieldset>}
      {variants.length === 0 && <p className="text-sm text-muted-foreground">This product is currently unavailable.</p>}
      <CartForm key={selectedId} variantId={selectedId} operation="add" disabled={!selected?.inStock}
        itemLabel={selected ? (variants.length > 1 ? `${productName} · ${selected.title}` : productName) : undefined} />
    </div>
  );
}
