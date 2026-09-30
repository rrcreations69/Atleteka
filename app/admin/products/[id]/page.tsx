import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { ImageEditForms, ImageUploadForm, ProductCategoriesForm, ProductDetailsForm, VariantForm } from "@/components/admin/forms";
import { Container } from "@/components/layout/container";
import { getAdminProduct, listAdminCategories } from "@/lib/admin/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit product | Admin | Atleteka" };

export default async function AdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = await getAdminProduct((await params).id);
  if (!product) notFound();
  const categories = await listAdminCategories();
  return <Container className="space-y-10 py-10">
    <AdminNav />
    <div className="space-y-2">
      <Link href="/admin/products" className="inline-flex min-h-11 items-center underline underline-offset-4">All products</Link>
      <h1 className="break-words text-3xl font-semibold">{product.name}</h1>
      {product.status === "active" && <p><Link href={`/products/${product.slug}`} className="underline underline-offset-4">View in shop</Link></p>}
    </div>
    <section aria-labelledby="details" className="max-w-xl space-y-4">
      <h2 id="details" className="text-xl font-semibold">Details</h2>
      <ProductDetailsForm product={product} />
    </section>
    <section aria-labelledby="options" className="space-y-4">
      <h2 id="options" className="text-xl font-semibold">Options (sizes, colors and so on)</h2>
      {product.product_variants.length === 0 && <p role="status">No options yet. A product needs at least one active option with stock to be bought.</p>}
      {product.product_variants.map((variant) => <VariantForm key={variant.id} productId={product.id} variant={variant} />)}
      <h3 className="font-medium">Add an option</h3>
      <VariantForm productId={product.id} />
    </section>
    <section aria-labelledby="categories" className="max-w-xl space-y-4">
      <h2 id="categories" className="text-xl font-semibold">Categories</h2>
      <ProductCategoriesForm productId={product.id} categories={categories} selected={product.categoryIds} />
    </section>
    <section aria-labelledby="images" className="space-y-4">
      <h2 id="images" className="text-xl font-semibold">Images</h2>
      {product.product_images.length === 0 && <p role="status">No images yet.</p>}
      {product.product_images.map((image) => <ImageEditForms key={image.id} productId={product.id} image={image} />)}
      <div className="max-w-xl"><ImageUploadForm productId={product.id} /></div>
    </section>
  </Container>;
}
