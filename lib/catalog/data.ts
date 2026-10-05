import "server-only";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { getAuthConfig } from "@/lib/supabase/config";
import {
  PAGE_SIZE, catalogQuerySchema, literalSearchPattern, slugSchema, productSchema, categorySchema, availabilitySchema, toCatalogProduct,
  imageSchema, publicImageUrl, type CatalogImage,
  type ProductRow, type CatalogProduct, type CatalogQuery,
} from "./validation";

const productColumns = "id,slug,name,description,product_variants(id,title,price,active),product_images(id,storage_path,alt_text,sort_order)";

async function withAvailability(rows: ProductRow[]) {
  const ids = rows.flatMap((row) => row.product_variants.filter((variant) => variant.active).map((variant) => variant.id));
  const stock = new Map<string, boolean>();
  for (let offset = 0; offset < ids.length; offset += 100) {
    const { data, error } = await createPublicSupabaseClient().from("product_availability").select("variant_id,in_stock").in("variant_id", ids.slice(offset, offset + 100));
    if (error) throw new Error("Product availability could not be loaded.");
    for (const row of availabilitySchema.parse(data)) stock.set(row.variant_id, row.in_stock);
  }
  return rows.map((row) => toCatalogProduct(row, stock, getAuthConfig().url));
}

export async function getCategories() {
  const { data, error } = await createPublicSupabaseClient().from("categories").select("id,slug,name").eq("active", true).order("name").order("id");
  if (error) throw new Error("Categories could not be loaded.");
  return z.array(categorySchema).parse(data);
}

export async function getCategory(slug: string) {
  const { data, error } = await createPublicSupabaseClient().from("categories").select("id,slug,name").eq("slug", slugSchema.parse(slug)).eq("active", true).maybeSingle();
  if (error) throw new Error("Category could not be loaded.");
  return data ? categorySchema.parse(data) : null;
}

export async function getProducts(input: CatalogQuery, categoryId?: string) {
  const queryInput = catalogQuerySchema.parse(input);
  const start = (queryInput.page - 1) * PAGE_SIZE;
  const createQuery = () => {
    let query = createPublicSupabaseClient().from("products")
      .select(productColumns + (categoryId ? ",product_categories!inner(category_id)" : ""), { count: "exact" })
      .eq("status", "active").order("name").order("id");
    if (categoryId) query = query.eq("product_categories.category_id", z.uuid().parse(categoryId));
    if (queryInput.q) query = query.filter("name", "imatch", literalSearchPattern(queryInput.q));
    return query;
  };
  if (queryInput.availability !== "in-stock") {
    const { data, count, error } = await createQuery().range(start, start + PAGE_SIZE - 1);
    if (error?.code === "PGRST103") return null;
    if (error || count === null) throw new Error("Products could not be loaded.");
    return { products: await withAvailability(z.array(productSchema).parse(data)), total: z.number().int().nonnegative().parse(count) };
  }

  // Apply availability before pagination, including matches beyond the API row limit.
  // Keep only the requested page; all stock reads use the existing public booleans.
  const products: CatalogProduct[] = [];
  let total = 0;
  for (let offset = 0; ; ) {
    const { data, count, error } = await createQuery().range(offset, offset + 99);
    if (error?.code === "PGRST103") break;
    if (error || count === null) throw new Error("Products could not be loaded.");
    const rows = z.array(productSchema).parse(data);
    const matchCount = z.number().int().nonnegative().parse(count);
    for (const product of await withAvailability(rows)) {
      if (!product.variants.some((variant) => variant.inStock)) continue;
      if (total >= start && products.length < PAGE_SIZE) products.push(product);
      total++;
    }
    offset += rows.length;
    if (offset >= matchCount) break;
    if (rows.length === 0) throw new Error("Products could not be loaded.");
  }
  return { products, total };
}

export async function getProduct(slug: string) {
  const { data, error } = await createPublicSupabaseClient().from("products").select(productColumns)
    .eq("slug", slugSchema.parse(slug)).eq("status", "active").maybeSingle();
  if (error) throw new Error("Product could not be loaded.");
  if (!data) return null;
  return (await withAvailability([productSchema.parse(data)]))[0];
}

// First image per active product, for cart thumbnails. Public catalog data only; any failure
// returns no thumbnails so the cart still renders.
export async function getProductThumbnails(slugs: string[]) {
  const thumbnails = new Map<string, CatalogImage>();
  const unique = [...new Set(slugs)].map((slug) => slugSchema.parse(slug)).slice(0, 100);
  if (unique.length === 0) return thumbnails;
  const { data, error } = await createPublicSupabaseClient().from("products")
    .select("slug,name,product_images(id,storage_path,alt_text,sort_order)").in("slug", unique).eq("status", "active");
  if (error) return thumbnails;
  const rows = z.array(z.object({ slug: slugSchema, name: z.string().min(1), product_images: z.array(imageSchema) })).safeParse(data);
  if (!rows.success) return thumbnails;
  for (const row of rows.data) {
    const image = [...row.product_images].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))[0];
    if (image) thumbnails.set(row.slug, { id: image.id, url: publicImageUrl(getAuthConfig().url, image.storage_path), alt: image.alt_text || row.name });
  }
  return thumbnails;
}

// Active product and category URLs for sitemap.xml (public catalog data only).
export async function getSitemapEntries() {
  const client = createPublicSupabaseClient();
  const [products, categories] = await Promise.all([
    client.from("products").select("slug,updated_at").eq("status", "active").order("slug").limit(5000),
    client.from("categories").select("slug").eq("active", true).order("slug").limit(1000),
  ]);
  if (products.error || categories.error) throw new Error("Sitemap entries could not be loaded.");
  return {
    products: z.array(z.object({ slug: slugSchema, updated_at: z.string() })).parse(products.data)
      .map((row) => ({ slug: row.slug, updatedAt: new Date(row.updated_at) })),
    categories: z.array(z.object({ slug: slugSchema })).parse(categories.data).map((row) => row.slug),
  };
}
