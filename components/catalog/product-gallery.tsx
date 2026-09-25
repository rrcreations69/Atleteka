"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CatalogImage } from "@/lib/catalog/validation";
import { ProductImage } from "./product-image";

export function ProductGallery({ images }: { images: CatalogImage[] }) {
  const [selected, setSelected] = useState(images[0]?.id);
  const current = images.find((image) => image.id === selected) ?? images[0];
  return (
    <div className="min-w-0 space-y-4">
      <ProductImage key={current?.id ?? "empty"} image={current} sizes="(min-width: 1024px) 50vw, 100vw" />
      {images.length > 1 && <div className="flex flex-wrap gap-3" role="group" aria-label="Product images">
        {images.map((image, index) => <Button key={image.id} variant={current?.id === image.id ? "default" : "outline"} className="h-auto w-20 p-1" aria-label={`Show image ${index + 1}: ${image.alt}`} aria-pressed={current?.id === image.id} onClick={() => setSelected(image.id)}>
          <ProductImage image={image} sizes="72px" />
        </Button>)}
      </div>}
    </div>
  );
}
