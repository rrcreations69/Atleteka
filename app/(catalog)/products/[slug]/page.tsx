import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { VariantSelector } from "@/components/catalog/variant-selector";
import { getProduct } from "@/lib/catalog/data";
import { slugSchema } from "@/lib/catalog/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Product | Atleteka" };

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = slugSchema.safeParse((await params).slug);
  if (!slug.success) notFound();
  const product = await getProduct(slug.data);
  if (!product) notFound();
  return (
    <Container className="py-10 sm:py-16">
      <Link href="/shop" className="mb-8 inline-flex min-h-11 items-center text-sm underline underline-offset-4">Back to shop</Link>
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} />
        <div className="min-w-0 space-y-7">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
          <VariantSelector variants={product.variants} />
          <section aria-labelledby="product-description">
            <h2 id="product-description" className="mb-3 text-lg font-semibold">Description</h2>
            <p className="whitespace-pre-line break-words leading-relaxed text-muted-foreground">{product.description || "No description is available for this product."}</p>
          </section>
        </div>
      </div>
    </Container>
  );
}
