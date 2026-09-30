import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { publicImageUrl } from "@/lib/catalog/validation";
import { getAuthConfig } from "@/lib/supabase/config";
import { createSupabaseClient } from "@/lib/supabase/server";

// Every reader re-checks the admin role; RLS additionally limits drafts and stock to admins.
async function adminClient() {
  await requireAdmin();
  return createSupabaseClient();
}

const money = z.union([z.number(), z.string()]).transform(String);
const inventorySchema = z.union([
  z.object({ quantity_on_hand: z.number().int() }),
  z.array(z.object({ quantity_on_hand: z.number().int() })),
]).nullable().transform((value) => Array.isArray(value) ? value[0]?.quantity_on_hand ?? null : value?.quantity_on_hand ?? null);
const variantSchema = z.object({
  id: z.uuid(), title: z.string(), sku: z.string(), price: money, active: z.boolean(), inventory: inventorySchema,
});

export async function listAdminProducts() {
  const supabase = await adminClient();
  const { data, error } = await supabase.from("products")
    .select("id, name, slug, status, updated_at, product_variants(id, active)")
    .order("updated_at", { ascending: false }).limit(500);
  if (error) throw new Error("Products could not be loaded.");
  return z.array(z.object({
    id: z.uuid(), name: z.string(), slug: z.string(), status: z.enum(["active", "inactive"]), updated_at: z.string(),
    product_variants: z.array(z.object({ id: z.uuid(), active: z.boolean() })),
  })).parse(data);
}

export async function getAdminProduct(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await adminClient();
  const { data, error } = await supabase.from("products")
    .select("id, name, slug, description, status, product_variants(id, title, sku, price, active, inventory(quantity_on_hand)), product_images(id, storage_path, alt_text, sort_order), product_categories(category_id)")
    .eq("id", id).maybeSingle();
  if (error) throw new Error("This product could not be loaded.");
  if (!data) return null;
  const product = z.object({
    id: z.uuid(), name: z.string(), slug: z.string(), description: z.string(), status: z.enum(["active", "inactive"]),
    product_variants: z.array(variantSchema),
    product_images: z.array(z.object({ id: z.uuid(), storage_path: z.string(), alt_text: z.string(), sort_order: z.number().int() })),
    product_categories: z.array(z.object({ category_id: z.uuid() })),
  }).parse(data);
  const baseUrl = getAuthConfig().url;
  return {
    ...product,
    product_variants: [...product.product_variants].sort((a, b) => a.sku.localeCompare(b.sku)),
    product_images: [...product.product_images].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
      .map((image) => ({ ...image, url: publicImageUrl(baseUrl, image.storage_path) })),
    categoryIds: product.product_categories.map((row) => row.category_id),
  };
}
export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

export async function listAdminCategories() {
  const supabase = await adminClient();
  const { data, error } = await supabase.from("categories").select("id, name, slug, active").order("name").order("id");
  if (error) throw new Error("Categories could not be loaded.");
  return z.array(z.object({ id: z.uuid(), name: z.string(), slug: z.string(), active: z.boolean() })).parse(data);
}

export async function listInventory() {
  const supabase = await adminClient();
  const { data, error } = await supabase.from("product_variants")
    .select("id, title, sku, active, inventory(quantity_on_hand), products(id, name, status)")
    .order("sku").limit(1000);
  if (error) throw new Error("Inventory could not be loaded.");
  return z.array(z.object({
    id: z.uuid(), title: z.string(), sku: z.string(), active: z.boolean(), inventory: inventorySchema,
    products: z.object({ id: z.uuid(), name: z.string(), status: z.enum(["active", "inactive"]) }),
  })).parse(data);
}
