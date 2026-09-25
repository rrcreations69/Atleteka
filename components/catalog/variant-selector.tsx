"use client";

import { useState } from "react";
import { CartForm } from "@/components/cart/cart-form";
import { Label } from "@/components/ui/label";
import { formatPrice, priceLabel, type CatalogVariant } from "@/lib/catalog/validation";

export function VariantSelector({ variants }: { variants: CatalogVariant[] }) {
  const [selectedId, setSelectedId] = useState(variants.length === 1 ? variants[0].id : "");
  const selected = variants.find((variant) => variant.id === selectedId);
  return (
    <div className="space-y-5">
      {variants.length > 0 && <div className="space-y-2">
        <Label htmlFor="variant">Choose an option</Label>
        <select id="variant" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" aria-describedby="variant-status">
          <option value="">Select an option</option>
          {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.title}{variant.inStock ? "" : " - Sold out"}</option>)}
        </select>
      </div>}
      <div id="variant-status" aria-live="polite" aria-atomic="true" className="space-y-2">
        <p className="text-2xl font-semibold">{selected ? formatPrice(selected.price) : priceLabel(variants)}</p>
        <p className="text-sm text-muted-foreground">{selected ? selected.inStock ? "In stock" : "Sold out" : variants.length ? "Select an option to see availability." : "This product is currently unavailable."}</p>
      </div>
      <CartForm key={selectedId} variantId={selectedId} operation="add" disabled={!selected?.inStock} />
    </div>
  );
}
