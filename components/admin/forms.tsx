"use client";

import { ActionForm } from "@/components/admin/action-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TextField } from "@/components/ui/text-field";
import {
  createProduct, removeImage, saveCategory, saveProductCategories, saveVariant, setStock, updateImage, updateProduct, uploadImage,
} from "@/lib/admin/actions";

const selectClass = "min-h-11 w-full min-w-0 rounded-sm border border-input bg-field px-3";
const areaClass = "min-h-28 w-full min-w-0 rounded-sm border border-input bg-field px-3 py-2";

function Checkbox({ id, name, label, defaultChecked, value }: { id: string; name: string; label: string; defaultChecked: boolean; value?: string }) {
  return <label htmlFor={id} className="flex min-h-11 items-center gap-2">
    <input id={id} name={name} type="checkbox" value={value} defaultChecked={defaultChecked} className="size-4" /> {label}
  </label>;
}

export function NewProductForm() {
  return <ActionForm action={createProduct} submitLabel="Create product" pendingLabel="Creating…">
    {(errors) => <>
      <TextField id="new-name" name="name" label="Name" required maxLength={200} error={errors.name} />
      <TextField id="new-slug" name="slug" label="Slug (web address)" description="Lowercase letters, numbers and hyphens, e.g. training-shirt." required maxLength={200} error={errors.slug} />
      <div className="space-y-2"><Label htmlFor="new-description">Description</Label>
        <textarea id="new-description" name="description" maxLength={5000} className={areaClass} /></div>
      <p className="text-sm text-muted-foreground">New products start archived. Add options, stock and images, then set the status to Active.</p>
    </>}
  </ActionForm>;
}

export function ProductDetailsForm({ product }: { product: { id: string; name: string; slug: string; description: string; status: "active" | "inactive" } }) {
  return <ActionForm action={updateProduct} submitLabel="Save product">
    {(errors) => <>
      <input type="hidden" name="productId" value={product.id} />
      <TextField id="product-name" name="name" label="Name" required maxLength={200} defaultValue={product.name} error={errors.name} />
      <TextField id="product-slug" name="slug" label="Slug (web address)" required maxLength={200} defaultValue={product.slug} error={errors.slug} />
      <div className="space-y-2"><Label htmlFor="product-description">Description</Label>
        <textarea id="product-description" name="description" maxLength={5000} defaultValue={product.description} className={areaClass} /></div>
      <div className="space-y-2"><Label htmlFor="product-status">Status</Label>
        <select id="product-status" name="status" defaultValue={product.status} className={selectClass}>
          <option value="active">Active (visible in the shop)</option>
          <option value="inactive">Archived (hidden from the shop)</option>
        </select></div>
    </>}
  </ActionForm>;
}

type Variant = { id: string; title: string; sku: string; price: string; active: boolean; inventory: number | null };
export function VariantForm({ productId, variant }: { productId: string; variant?: Variant }) {
  const key = variant?.id ?? "new";
  return <ActionForm action={saveVariant} submitLabel={variant ? "Save option" : "Add option"} variant={variant ? "outline" : "default"}
    className={variant ? "border border-border p-4" : undefined}>
    {(errors) => <>
      <input type="hidden" name="productId" value={productId} />
      {variant && <input type="hidden" name="variantId" value={variant.id} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField id={`title-${key}`} name="title" label="Option" placeholder="e.g. Medium" required maxLength={120} defaultValue={variant?.title} error={errors.title} />
        <TextField id={`sku-${key}`} name="sku" label="SKU" required maxLength={64} defaultValue={variant?.sku} error={errors.sku} />
        <TextField id={`price-${key}`} name="price" label="Price (PHP)" inputMode="decimal" required defaultValue={variant?.price} error={errors.price} />
      </div>
      <Checkbox id={`active-${key}`} name="active" label="Active (can be bought)" defaultChecked={variant?.active ?? true} />
      {variant && <p className="text-sm text-muted-foreground">Stock: {variant.inventory ?? "no stock row"} (change it on the Inventory page)</p>}
    </>}
  </ActionForm>;
}

export function ProductCategoriesForm({ productId, categories, selected }: {
  productId: string; categories: { id: string; name: string; active: boolean }[]; selected: string[];
}) {
  if (categories.length === 0) return <p className="text-sm">No categories yet. Create one on the Categories page.</p>;
  return <ActionForm action={saveProductCategories} submitLabel="Save categories" variant="outline">
    <input type="hidden" name="productId" value={productId} />
    <fieldset className="space-y-1"><legend className="sr-only">Categories</legend>
      {categories.map((category) => <Checkbox key={category.id} id={`cat-${category.id}`} name="categoryId" value={category.id}
        label={category.name + (category.active ? "" : " (inactive)")} defaultChecked={selected.includes(category.id)} />)}
    </fieldset>
    {/* Unchecked boxes send nothing, so the checked values are the complete new set. */}
  </ActionForm>;
}

export function ImageUploadForm({ productId }: { productId: string }) {
  return <ActionForm action={uploadImage} submitLabel="Upload image" pendingLabel="Uploading…" encType="multipart/form-data">
    {(errors) => <>
      <input type="hidden" name="productId" value={productId} />
      <div className="space-y-2"><Label htmlFor="image-file">Image (JPEG, PNG or WebP, up to 4 MB)</Label>
        <input id="image-file" name="image" type="file" accept="image/jpeg,image/png,image/webp" required
          aria-invalid={errors.image ? true : undefined} className="block w-full text-sm" />
        {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}</div>
      <TextField id="image-alt" name="altText" label="Description for screen readers" required maxLength={200} error={errors.altText} />
    </>}
  </ActionForm>;
}

export function ImageEditForms({ productId, image }: { productId: string; image: { id: string; url: string; alt_text: string; sort_order: number } }) {
  return <div className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-[8rem_1fr]">
    {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of a public storage URL */}
    <img src={image.url} alt={image.alt_text} className="aspect-square w-32 rounded-md object-cover" />
    <div className="min-w-0 space-y-3">
      <ActionForm action={updateImage} submitLabel="Save image" variant="outline">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="imageId" value={image.id} />
        <TextField id={`alt-${image.id}`} name="altText" label="Description" required maxLength={200} defaultValue={image.alt_text} />
        <TextField id={`order-${image.id}`} name="sortOrder" label="Order (0 shows first)" inputMode="numeric" required defaultValue={String(image.sort_order)} />
      </ActionForm>
      <ActionForm action={removeImage} submitLabel="Remove image" pendingLabel="Removing…" variant="outline">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="imageId" value={image.id} />
      </ActionForm>
    </div>
  </div>;
}

export function CategoryForm({ category }: { category?: { id: string; name: string; slug: string; active: boolean } }) {
  const key = category?.id ?? "new";
  return <ActionForm action={saveCategory} submitLabel={category ? "Save category" : "Create category"} variant={category ? "outline" : "default"}
    className={category ? "border border-border p-4" : undefined}>
    {(errors) => <>
      {category && <input type="hidden" name="categoryId" value={category.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField id={`cat-name-${key}`} name="name" label="Name" required maxLength={120} defaultValue={category?.name} error={errors.name} />
        <TextField id={`cat-slug-${key}`} name="slug" label="Slug" required maxLength={200} defaultValue={category?.slug} error={errors.slug} />
      </div>
      <Checkbox id={`cat-active-${key}`} name="active" label="Active (shown in the shop)" defaultChecked={category?.active ?? true} />
    </>}
  </ActionForm>;
}

export function StockForm({ variantId, current, label }: { variantId: string; current: number | null; label: string }) {
  const id = `stock-${variantId}`;
  return <ActionForm action={setStock} submitLabel="Set stock" variant="outline" fieldsetClassName="flex items-end gap-2 space-y-0">
    <input type="hidden" name="variantId" value={variantId} />
    <input type="hidden" name="expected" value={String(current ?? 0)} />
    <div className="space-y-1.5">
      <Label htmlFor={id}>New stock<span className="sr-only"> for {label}</span></Label>
      <Input id={id} name="quantity" inputMode="numeric" required defaultValue={String(current ?? 0)} className="w-24" />
    </div>
  </ActionForm>;
}
