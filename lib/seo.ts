import { brand } from "./brand";
// Next.js replaces (does not merge) a parent's openGraph, so pages that set their own spread these defaults.
export const openGraphDefaults = { siteName: brand.name, type: "website", locale: "en_PH" } as const;
