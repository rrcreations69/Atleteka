import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Container } from "@/components/layout/container";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { VariantSelector } from "@/components/catalog/variant-selector";
import { getProduct } from "@/lib/catalog/data";
import { slugSchema } from "@/lib/catalog/validation";
import { openGraphDefaults } from "@/lib/seo";

export const dynamic = "force-dynamic";

// One query per request for both the metadata and the page.
const loadProduct = cache(getProduct);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = slugSchema.safeParse((await params).slug);
  const product = slug.success ? await loadProduct(slug.data) : null;
  if (!product) return { title: "Product not found | Atleteka" };
  const title = `${product.name} | Atleteka`;
  const description = product.description.replace(/\s+/g, " ").trim().slice(0, 160) || `Shop ${product.name} at Atleteka.`;
  const path = `/products/${product.slug}`;
  const image = product.images[0];
  return {
    title, description, alternates: { canonical: path },
    openGraph: { ...openGraphDefaults, title, description, url: path, images: image ? [{ url: image.url, alt: image.alt }] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = slugSchema.safeParse((await params).slug);
  if (!slug.success) notFound();
  const product = await loadProduct(slug.data);
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
