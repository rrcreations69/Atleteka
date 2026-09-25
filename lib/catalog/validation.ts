import { z } from "zod";

export const PAGE_SIZE = 12;
export const slugSchema = z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i);
export const pageSchema = z.coerce.number<string | number>().int().min(1).max(100000);
export const storagePathSchema = z.string().min(1).max(1024).refine(
  (path) => !path.startsWith("/") && !/[\\\\?#\x00-\x1f]/.test(path) &&
    path.split("/").every((part) => part !== "" && part !== "." && part !== ".."),
  "Invalid product image path",
);
export const imageSchema = z.object({
  id: z.uuid(), storage_path: storagePathSchema, alt_text: z.string(), sort_order: z.number().int(),
});
export const variantSchema = z.object({
  id: z.uuid(), title: z.string().min(1), price: z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER),
  active: z.boolean(),
});
export const productSchema = z.object({
  id: z.uuid(), slug: slugSchema, name: z.string().min(1), description: z.string(),
  product_variants: z.array(variantSchema), product_images: z.array(imageSchema),
});
export const categorySchema = z.object({ id: z.uuid(), slug: slugSchema, name: z.string().min(1) });
export const availabilitySchema = z.array(z.object({ variant_id: z.uuid(), in_stock: z.boolean() }));

export type ProductRow = z.infer<typeof productSchema>;
export type CatalogVariant = Pick<z.infer<typeof variantSchema>, "id" | "title" | "price"> & { inStock: boolean };
export type CatalogImage = { id: string; url: string; alt: string };
export type CatalogProduct = Pick<ProductRow, "id" | "slug" | "name" | "description"> & {
  variants: CatalogVariant[]; images: CatalogImage[];
};
export type CatalogCategory = z.infer<typeof categorySchema>;

// Intl accepts exact decimal strings at runtime; the TypeScript lib still types this as number.
export function formatPrice(value: number | string) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", currencyDisplay: "code" }).format(value as number);
}

export function priceLabel(variants: CatalogVariant[]) {
  if (variants.length === 0) return "Price unavailable";
  const prices = variants.map((variant) => variant.price);
  const minimum = Math.min(...prices);
  return (Math.max(...prices) > minimum ? "From " : "") + formatPrice(minimum);
}

export function publicImageUrl(baseUrl: string, path: string) {
  return new URL("/storage/v1/object/public/product-images/" +
    storagePathSchema.parse(path).split("/").map(encodeURIComponent).join("/"), baseUrl).href;
}

export function toCatalogProduct(row: ProductRow, stock: Map<string, boolean>, baseUrl: string): CatalogProduct {
  return {
    id: row.id, slug: row.slug, name: row.name, description: row.description,
    variants: row.product_variants.filter((variant) => variant.active).map((variant) => ({
      id: variant.id, title: variant.title, price: variant.price, inStock: stock.get(variant.id) ?? false,
    })).sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id)),
    images: [...row.product_images].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id)).map((image) => ({
      id: image.id, url: publicImageUrl(baseUrl, image.storage_path), alt: image.alt_text || row.name,
    })),
  };
}


export const catalogQuerySchema = z.object({
  q: z.string().trim().max(100).regex(/^[^\x00-\x1f\x7f]*$/).default(""),
  category: z.union([z.literal(""), slugSchema]).default(""),
  availability: z.enum(["", "all", "in-stock"]).default("all").transform((value) => value || "all"),
  page: z.union([z.string().regex(/^[1-9]\d*$/), z.number()]).pipe(pageSchema).default(1),
});
export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
export type CatalogSearchParams = Record<string, string | string[] | undefined>;

// Escape PostgreSQL regex syntax so search input is always literal text.
export function literalSearchPattern(value: string) {
  return value.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&");
}

export function catalogHref(base: string, query: CatalogQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.availability === "in-stock") params.set("availability", query.availability);
  if (query.page > 1) params.set("page", String(query.page));
  return base + (params.size ? "?" + params.toString() : "");
}
