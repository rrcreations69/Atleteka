"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseClient } from "@/lib/supabase/server";
import {
  MAX_IMAGE_BYTES, altTextSchema, categoryInputSchema, detectImage, fieldErrors, productInputSchema,
  single, stockInputSchema, variantInputSchema,
} from "./validation";

export type AdminState = { error?: string; message?: string; errors?: Record<string, string> };

/** Every mutation re-confirms the admin role server-side; RLS also limits writes to admins. */
async function admin() {
  await requireAdmin();
  return createSupabaseClient();
}
const uuid = (form: FormData, key: string) => z.uuid().safeParse(single(form, key)).data ?? null;
const checked = (form: FormData, key: string) => single(form, key) === "on";
const duplicate = (code: string | undefined) => code === "23505";

export async function createProduct(_state: AdminState, form: FormData): Promise<AdminState> {
  const input = productInputSchema.safeParse({
    name: single(form, "name"), slug: single(form, "slug"), description: single(form, "description") ?? "", status: "inactive",
  });
  if (!input.success) return { error: "Check the highlighted fields.", errors: fieldErrors(input.error) };
  const supabase = await admin();
  // New products start archived so an incomplete product never appears in the shop.
  const { data, error } = await supabase.from("products").insert(input.data).select("id").single();
  if (error) return duplicate(error.code) ? { errors: { slug: "This slug is already used." } } : { error: "The product could not be created." };
  redirect(`/admin/products/${data.id}`);
}

export async function updateProduct(_state: AdminState, form: FormData): Promise<AdminState> {
  const id = uuid(form, "productId");
  const input = productInputSchema.safeParse({
    name: single(form, "name"), slug: single(form, "slug"), description: single(form, "description") ?? "", status: single(form, "status"),
  });
  if (!id) return { error: "This product could not be saved." };
  if (!input.success) return { error: "Check the highlighted fields.", errors: fieldErrors(input.error) };
  const supabase = await admin();
  const { data, error } = await supabase.from("products")
    .update({ ...input.data, updated_at: new Date().toISOString() }).eq("id", id).select("id");
  if (error) return duplicate(error.code) ? { errors: { slug: "This slug is already used." } } : { error: "The product could not be saved." };
  if (!data?.length) return { error: "This product no longer exists." };
  revalidatePath(`/admin/products/${id}`);
  return { message: input.data.status === "active" ? "Saved. The product is visible in the shop." : "Saved. The product is archived (hidden from the shop)." };
}

export async function saveVariant(_state: AdminState, form: FormData): Promise<AdminState> {
  const productId = uuid(form, "productId");
  const variantId = single(form, "variantId") ? uuid(form, "variantId") : null;
  const input = variantInputSchema.safeParse({
    title: single(form, "title"), sku: single(form, "sku"), price: single(form, "price"), active: checked(form, "active"),
  });
  if (!productId || (single(form, "variantId") && !variantId)) return { error: "This option could not be saved." };
  if (!input.success) return { error: "Check the highlighted fields.", errors: fieldErrors(input.error) };
  const supabase = await admin();
  const result = variantId
    ? await supabase.from("product_variants").update(input.data).eq("id", variantId).eq("product_id", productId).select("id")
    : await supabase.from("product_variants").insert({ ...input.data, product_id: productId }).select("id");
  if (result.error) return duplicate(result.error.code) ? { errors: { sku: "This SKU is already used." } } : { error: "This option could not be saved." };
  if (!result.data?.length) return { error: "This option no longer exists." };
  if (!variantId) {
    // Every sellable option needs a stock row; it starts at zero until stock is set.
    const stock = await supabase.from("inventory").insert({ variant_id: result.data[0].id, quantity_on_hand: 0 });
    if (stock.error) return { error: "Option added, but its stock row could not be created. Set stock on the Inventory page." };
  }
  revalidatePath(`/admin/products/${productId}`);
  return { message: variantId ? "Option saved." : "Option added with 0 in stock." };
}

export async function saveProductCategories(_state: AdminState, form: FormData): Promise<AdminState> {
  const productId = uuid(form, "productId");
  const ids = z.array(z.uuid()).safeParse(form.getAll("categoryId"));
  if (!productId || !ids.success) return { error: "Categories could not be saved." };
  const wanted = [...new Set(ids.data)];
  const supabase = await admin();
  const current = await supabase.from("product_categories").select("category_id").eq("product_id", productId);
  if (current.error) return { error: "Categories could not be saved." };
  const have = new Set(current.data.map((row) => row.category_id as string));
  const add = wanted.filter((id) => !have.has(id)).map((category_id) => ({ product_id: productId, category_id }));
  const remove = [...have].filter((id) => !wanted.includes(id));
  if (add.length) {
    const { error } = await supabase.from("product_categories").insert(add);
    if (error) return { error: "Categories could not be saved." };
  }
  if (remove.length) {
    const { error } = await supabase.from("product_categories").delete().eq("product_id", productId).in("category_id", remove);
    if (error) return { error: "Categories could not be saved." };
  }
  revalidatePath(`/admin/products/${productId}`);
  return { message: "Categories saved." };
}

export async function uploadImage(_state: AdminState, form: FormData): Promise<AdminState> {
  const productId = uuid(form, "productId");
  const files = form.getAll("image");
  const alt = altTextSchema.safeParse(single(form, "altText"));
  if (!productId) return { error: "The image could not be uploaded." };
  if (files.length !== 1 || !(files[0] instanceof File) || files[0].size === 0) return { errors: { image: "Choose one image file." } };
  if (!alt.success) return { errors: { altText: alt.error.issues[0].message } };
  const file = files[0];
  if (file.size > MAX_IMAGE_BYTES) return { errors: { image: "Images must be 4 MB or smaller." } };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImage(bytes);
  if (!type) return { errors: { image: "Use a JPEG, PNG or WebP image." } };
  const supabase = await admin();
  const path = `products/${productId}/${randomUUID()}.${type.ext}`;
  // Content type comes from the detected signature, never from the browser.
  const upload = await supabase.storage.from("product-images").upload(path, bytes, { contentType: type.mime, upsert: false });
  if (upload.error) return { error: "The image could not be uploaded." };
  const last = await supabase.from("product_images").select("sort_order").eq("product_id", productId).order("sort_order", { ascending: false }).limit(1);
  const sortOrder = (last.data?.[0]?.sort_order as number | undefined ?? -1) + 1;
  const row = await supabase.from("product_images").insert({ product_id: productId, storage_path: path, alt_text: alt.data, sort_order: sortOrder });
  if (row.error) {
    await supabase.storage.from("product-images").remove([path]);
    return { error: "The image could not be saved." };
  }
  revalidatePath(`/admin/products/${productId}`);
  return { message: "Image uploaded." };
}

export async function updateImage(_state: AdminState, form: FormData): Promise<AdminState> {
  const productId = uuid(form, "productId");
  const imageId = uuid(form, "imageId");
  const alt = altTextSchema.safeParse(single(form, "altText"));
  const order = z.coerce.number<string>().int().min(0).max(1000).safeParse(single(form, "sortOrder"));
  if (!productId || !imageId) return { error: "The image could not be saved." };
  if (!alt.success || !order.success) return { error: alt.success ? "Order must be a whole number from 0 to 1000." : alt.error.issues[0].message };
  const supabase = await admin();
  const { data, error } = await supabase.from("product_images").update({ alt_text: alt.data, sort_order: order.data })
    .eq("id", imageId).eq("product_id", productId).select("id");
  if (error || !data?.length) return { error: "The image could not be saved." };
  revalidatePath(`/admin/products/${productId}`);
  return { message: "Image saved." };
}

export async function removeImage(_state: AdminState, form: FormData): Promise<AdminState> {
  const productId = uuid(form, "productId");
  const imageId = uuid(form, "imageId");
  if (!productId || !imageId) return { error: "The image could not be removed." };
  const supabase = await admin();
  const { data, error } = await supabase.from("product_images").delete().eq("id", imageId).eq("product_id", productId).select("storage_path");
  if (error || !data?.length) return { error: "The image could not be removed." };
  // The row is gone first so the shop never points at a missing file; a leftover file is harmless.
  await supabase.storage.from("product-images").remove([data[0].storage_path as string]);
  revalidatePath(`/admin/products/${productId}`);
  return { message: "Image removed." };
}

export async function saveCategory(_state: AdminState, form: FormData): Promise<AdminState> {
  const categoryId = single(form, "categoryId") ? uuid(form, "categoryId") : null;
  if (single(form, "categoryId") && !categoryId) return { error: "The category could not be saved." };
  const input = categoryInputSchema.safeParse({ name: single(form, "name"), slug: single(form, "slug"), active: checked(form, "active") });
  if (!input.success) return { error: "Check the highlighted fields.", errors: fieldErrors(input.error) };
  const supabase = await admin();
  const result = categoryId
    ? await supabase.from("categories").update(input.data).eq("id", categoryId).select("id")
    : await supabase.from("categories").insert(input.data).select("id");
  if (result.error) return duplicate(result.error.code) ? { errors: { slug: "This slug is already used." } } : { error: "The category could not be saved." };
  if (!result.data?.length) return { error: "This category no longer exists." };
  revalidatePath("/admin/categories");
  return { message: categoryId ? "Category saved." : "Category created." };
}

export async function setStock(_state: AdminState, form: FormData): Promise<AdminState> {
  const input = stockInputSchema.safeParse({
    variantId: single(form, "variantId"), expected: single(form, "expected"), quantity: single(form, "quantity"),
  });
  if (!input.success) return { error: fieldErrors(input.error).quantity ?? "Stock could not be saved." };
  const { variantId, expected, quantity } = input.data;
  const supabase = await admin();
  // Optimistic check (M11-P01): only apply if stock is still what the page showed.
  const { data, error } = await supabase.from("inventory").update({ quantity_on_hand: quantity })
    .eq("variant_id", variantId).eq("quantity_on_hand", expected).select("quantity_on_hand");
  if (error) return { error: "Stock could not be saved." };
  if (!data?.length) {
    const existing = await supabase.from("inventory").select("quantity_on_hand").eq("variant_id", variantId).maybeSingle();
    if (!existing.data) {
      const created = await supabase.from("inventory").insert({ variant_id: variantId, quantity_on_hand: quantity });
      if (created.error) return { error: "Stock could not be saved." };
    } else {
      return { error: `Stock changed to ${existing.data.quantity_on_hand} since this page loaded (for example, a sale). Reload and try again.` };
    }
  }
  revalidatePath("/admin/inventory");
  return { message: `Stock set to ${quantity}.` };
}
