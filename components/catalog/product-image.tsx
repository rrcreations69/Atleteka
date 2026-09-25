"use client";

import Image from "next/image";
import { useState } from "react";
import type { CatalogImage } from "@/lib/catalog/validation";

export function ProductImage({ image, sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" }: {
  image?: CatalogImage; sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
      {image && !failed ? <Image src={image.url} alt={image.alt} fill sizes={sizes} unoptimized className="object-contain" onError={() => setFailed(true)} />
        : <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">Image unavailable</div>}
    </div>
  );
}
