import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CatalogListing } from "@/components/catalog/catalog-listing";
import { getCategory } from "@/lib/catalog/data";
import { catalogQuerySchema, slugSchema, type CatalogSearchParams } from "@/lib/catalog/validation";
import { openGraphDefaults } from "@/lib/seo";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

const loadCategory = cache(getCategory);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = slugSchema.safeParse((await params).slug);
  const category = slug.success ? await loadCategory(slug.data) : null;
  if (!category) return { title: "Category not found" };
  const title = `${category.name} | ${brand.name}`;
  const description = `Shop ${category.name} at ${brand.name}.`;
  const path = `/categories/${category.slug}`;
  return { title: { absolute: title }, description, alternates: { canonical: path }, openGraph: { ...openGraphDefaults, title, description, url: path } };
}

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams>;
}) {
  const slug = slugSchema.safeParse((await params).slug);
  const query = catalogQuerySchema.safeParse(await searchParams);
  if (!slug.success || !query.success) notFound();
  const category = await loadCategory(slug.data);
  if (!category) notFound();
  return <CatalogListing category={category} query={query.data} />;
}
