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
    <Container className="py-6 sm:py-10">
      <Link href="/shop" className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <span aria-hidden="true">←</span> Back to shop
      </Link>
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} />
        <div className="min-w-0 space-y-6 lg:sticky lg:top-6">
          <h1 className="text-[2rem] leading-tight sm:text-4xl">{product.name}</h1>
          <VariantSelector variants={product.variants} />
          <section aria-labelledby="product-description" className="rounded-2xl bg-card p-5">
            <h2 id="product-description" className="mb-2 font-sans text-base font-semibold [font-variation-settings:normal]">Description</h2>
            <p className="whitespace-pre-line break-words leading-relaxed text-muted-foreground">{product.description || "No description is available for this product."}</p>
          </section>
          <ul className="space-y-2.5 rounded-2xl bg-card p-5 text-sm">
            <li className="flex items-center gap-2.5"><span aria-hidden="true" className="size-2 rounded-full bg-success" />Secure payment by card, QR Ph or e-wallet</li>
            <li className="flex items-center gap-2.5"><span aria-hidden="true" className="size-2 rounded-full bg-success" />Delivered anywhere in the Philippines</li>
            <li className="flex items-center gap-2.5"><span aria-hidden="true" className="size-2 rounded-full bg-success" />Guest checkout, no account needed</li>
          </ul>
        </div>
      </div>
    </Container>
  );
}
