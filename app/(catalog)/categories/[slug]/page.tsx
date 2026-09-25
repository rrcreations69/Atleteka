import { notFound } from "next/navigation";
import { CatalogListing } from "@/components/catalog/catalog-listing";
import { getCategory } from "@/lib/catalog/data";
import { catalogQuerySchema, slugSchema, type CatalogSearchParams } from "@/lib/catalog/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Category | Atleteka" };

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams>;
}) {
  const slug = slugSchema.safeParse((await params).slug);
  const query = catalogQuerySchema.safeParse(await searchParams);
  if (!slug.success || !query.success) notFound();
  const category = await getCategory(slug.data);
  if (!category) notFound();
  return <CatalogListing category={category} query={query.data} />;
}
