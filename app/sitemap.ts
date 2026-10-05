import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/catalog/data";

// Rebuilt at most hourly so new and archived products show up without a deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !URL.canParse(appUrl)) return [];
  const url = (path: string) => new URL(path, appUrl).href;
  const { products, categories } = await getSitemapEntries().catch(() => ({ products: [], categories: [] }));
  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/shop"), changeFrequency: "daily", priority: 0.9 },
    ...categories.map((slug) => ({ url: url("/categories/" + slug), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((product) => ({ url: url("/products/" + product.slug), lastModified: product.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
