import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, adminPanel } from "@/components/admin/admin-nav";
import { ImageEditForms, ImageUploadForm, ProductCategoriesForm, ProductDetailsForm, VariantForm } from "@/components/admin/forms";
import { getAdminProduct, listAdminCategories } from "@/lib/admin/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit product | Admin | Atleteka" };

export default async function AdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = await getAdminProduct((await params).id);
  if (!product) notFound();
  const categories = await listAdminCategories();
  return <AdminShell title={product.name}
    description={product.status === "active" ? <p><Link href={"/products/" + product.slug} className="underline underline-offset-4">View in shop</Link></p> : <p>Archived: hidden from the shop.</p>}>
    <Link href="/admin/products" className="eyebrow -mt-4 inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><span aria-hidden="true">←</span> All products</Link>
    <div className="grid gap-10 xl:grid-cols-2">
      <section aria-labelledby="details" className={adminPanel + " self-start"}>
        <h2 id="details" className="text-lg">Details</h2>
        <ProductDetailsForm product={product} />
      </section>
      <section aria-labelledby="categories" className={adminPanel + " self-start"}>
        <h2 id="categories" className="text-lg">Categories</h2>
        <ProductCategoriesForm productId={product.id} categories={categories} selected={product.categoryIds} />
      </section>
    </div>
    <section aria-labelledby="options" className="space-y-4">
      <h2 id="options" className="text-xl">Options (sizes, colors and so on)</h2>
      {product.product_variants.length === 0 && <p role="status" className="text-sm text-muted-foreground">No options yet. A product needs at least one active option with stock to be bought.</p>}
      {product.product_variants.map((variant) => <VariantForm key={variant.id} productId={product.id} variant={variant} />)}
      <div className={adminPanel}>
        <h3 className="font-semibold">Add an option</h3>
        <VariantForm productId={product.id} />
      </div>
    </section>
    <section aria-labelledby="images" className="space-y-4">
      <h2 id="images" className="text-xl">Images</h2>
      {product.product_images.length === 0 && <p role="status" className="text-sm text-muted-foreground">No images yet.</p>}
      {product.product_images.map((image) => <ImageEditForms key={image.id} productId={product.id} image={image} />)}
      <div className={adminPanel + " max-w-xl"}><ImageUploadForm productId={product.id} /></div>
    </section>
  </AdminShell>;
}
