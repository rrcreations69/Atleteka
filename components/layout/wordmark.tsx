import Image from "next/image";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** The store's logo when lib/brand.ts sets one, otherwise its name as a spaced uppercase wordmark. */
export function Wordmark({ variant = "header", className }: { variant?: "header" | "footer"; className?: string }) {
  const logo = brand.logo;
  // The footer is dark, so it shows a logo only when a light version (footerSrc) is provided.
  const src = variant === "footer" ? logo?.footerSrc : logo?.src;
  if (logo && src) {
    return <Image src={src} alt={brand.name} width={logo.width} height={logo.height} unoptimized priority={variant === "header"} className={className} />;
  }
  return <span className={cn("pl-[0.32em] font-bold uppercase tracking-[0.32em]", className)}>{brand.name}</span>;
}
