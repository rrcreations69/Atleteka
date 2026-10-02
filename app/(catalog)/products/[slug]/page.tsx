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
    <Container className="py-4 sm:py-8">
      <Link href="/shop" className="eyebrow mb-3 inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <span aria-hidden="true">←</span> Back to shop
      </Link>
      <div className="grid items-start gap-8 lg:grid-cols-[3fr_2fr] lg:gap-14">
        <ProductGallery images={product.images} />
        <div className="min-w-0 space-y-7 lg:sticky lg:top-6">
          <h1 className="text-2xl leading-tight sm:text-3xl">{product.name}</h1>
          <VariantSelector variants={product.variants} />
          <div className="border-t border-border">
            <section aria-labelledby="product-description" className="border-b border-border py-5">
              <h2 id="product-description" className="eyebrow mb-3 text-xs tracking-[0.12em]">Description</h2>
              <p className="whitespace-pre-line break-words leading-relaxed text-muted-foreground">{product.description || "No description is available for this product."}</p>
            </section>
            <section aria-labelledby="product-delivery" className="border-b border-border py-5">
              <h2 id="product-delivery" className="eyebrow mb-3 text-xs tracking-[0.12em]">Delivery &amp; payment</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Secure payment by card, QR Ph or e-wallet via PayMongo</li>
                <li>Delivered anywhere in the Philippines; shipping is paid to the courier on delivery</li>
                <li>Guest checkout, no account needed</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Container>
  );
}
