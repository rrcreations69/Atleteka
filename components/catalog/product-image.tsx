"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CatalogImage } from "@/lib/catalog/validation";

export function ProductImage({ image, sizes = "(min-width: 1024px) 25vw, 50vw", shape = "portrait", className }: {
  image?: CatalogImage; sizes?: string; shape?: "portrait" | "square"; className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl bg-sand", shape === "portrait" ? "aspect-[3/4]" : "aspect-square", className)}>
      {image && !failed ? <Image src={image.url} alt={image.alt} fill sizes={sizes} unoptimized className="object-cover" onError={() => setFailed(true)} />
        : <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">Photo coming soon</div>}
    </div>
  );
}
