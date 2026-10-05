// Seeds the demo catalog (categories, products, variants, stock, images). Safe to re-run: rows are
// upserted by slug/SKU and images are only uploaded for products that have none.
// Usage: node --env-file=.env.local scripts/demo-catalog/seed.mjs [imageDir] [--replace-images]
// --replace-images uploads the current files under new versioned paths, repoints the existing rows
// and removes the old objects (new paths avoid stale CDN copies).
// Uses the service role key from the environment; it is never printed.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES, PRODUCTS, RETIRED_CATEGORY_SLUGS, RETIRED_PRODUCT_SLUGS } from "./catalog.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
const args = process.argv.slice(2);
const replaceImages = args.includes("--replace-images");
const imageDir = args.find((arg) => !arg.startsWith("--")) ?? path.join(".verification", "demo-catalog");
const IMAGE_VERSION = "v3";
const db = createClient(url, key, { auth: { persistSession: false } });

function check(result, what) {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

const categories = check(await db.from("categories")
  .upsert(CATEGORIES.map((category) => ({ ...category, active: true })), { onConflict: "slug" })
  .select("id,slug"), "categories");
const categoryId = Object.fromEntries(categories.map((category) => [category.slug, category.id]));
check(await db.from("categories").update({ active: false }).in("slug", RETIRED_CATEGORY_SLUGS), "retire categories");
check(await db.from("products").update({ status: "inactive" }).in("slug", RETIRED_PRODUCT_SLUGS), "retire fixtures");

for (const item of PRODUCTS) {
  const [product] = check(await db.from("products")
    .upsert({ slug: item.slug, name: item.name, description: item.description, status: "active" }, { onConflict: "slug" })
    .select("id"), `product ${item.slug}`);
  const variants = check(await db.from("product_variants")
    .upsert(item.sizes.map((size) => ({ product_id: product.id, sku: `${item.code}-${size === "One size" ? "OS" : size}`, title: size, price: item.price, active: true })), { onConflict: "sku" })
    .select("id,sku"), `variants ${item.slug}`);
  check(await db.from("inventory")
    .upsert(variants.map((variant) => ({ variant_id: variant.id, quantity_on_hand: item.stock[item.sizes.indexOf(variant.sku.endsWith("-OS") ? "One size" : variant.sku.split("-").pop())] })), { onConflict: "variant_id" }),
  `inventory ${item.slug}`);
  check(await db.from("product_categories").delete().eq("product_id", product.id), `clear categories ${item.slug}`);
  check(await db.from("product_categories").insert(item.categories.map((slug) => ({ product_id: product.id, category_id: categoryId[slug] }))), `categories ${item.slug}`);

  const existing = check(await db.from("product_images").select("id,storage_path,sort_order").eq("product_id", product.id).order("sort_order"), `images ${item.slug}`);
  if (replaceImages && existing.length > 0) {
    for (const row of existing.slice(0, 2)) {
      const storagePath = `products/${product.id}/demo-${IMAGE_VERSION}-${row.sort_order + 1}.webp`;
      check(await db.from("product_images").update({ alt_text: `${item.name}, ${row.sort_order === 0 ? "front view" : "detail"}` }).eq("id", row.id), `alt ${item.slug}`);
      if (row.storage_path === storagePath) continue;
      const bytes = await readFile(path.join(imageDir, `${item.slug}-${row.sort_order + 1}.webp`));
      check(await db.storage.from("product-images").upload(storagePath, bytes, { contentType: "image/webp", upsert: true }), `upload ${item.slug}`);
      check(await db.from("product_images").update({ storage_path: storagePath }).eq("id", row.id), `repoint ${item.slug}`);
      check(await db.storage.from("product-images").remove([row.storage_path]), `remove old ${item.slug}`);
    }
  }
  if (existing.length === 0) {
    for (const [index, view] of ["front view", "detail"].entries()) {
      const storagePath = `products/${product.id}/demo-${IMAGE_VERSION}-${index + 1}.webp`;
      const bytes = await readFile(path.join(imageDir, `${item.slug}-${index + 1}.webp`));
      check(await db.storage.from("product-images").upload(storagePath, bytes, { contentType: "image/webp", upsert: true }), `upload ${item.slug}`);
      check(await db.from("product_images").insert({ product_id: product.id, storage_path: storagePath, alt_text: `${item.name}, ${view}`, sort_order: index }), `image row ${item.slug}`);
    }
  }
  console.log(`${item.slug}: ${variants.length} sizes, ${existing.length === 0 ? "2 images uploaded" : replaceImages ? "images replaced" : "images kept"}`);
}
console.log(`Done: ${CATEGORIES.length} categories, ${PRODUCTS.length} products.`);
