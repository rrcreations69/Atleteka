import { brand } from "./brand";
// Next.js replaces (does not merge) a parent's openGraph, so pages that set their own spread these defaults.
// The image is the generated card from app/opengraph-image.tsx; product pages replace it with a product photo.
export const openGraphDefaults = {
  siteName: brand.name, type: "website" as const, locale: "en_PH",
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: brand.name }],
};
