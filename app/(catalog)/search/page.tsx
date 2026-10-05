import { notFound } from "next/navigation";
import { CatalogListing } from "@/components/catalog/catalog-listing";
import { catalogQuerySchema, type CatalogSearchParams } from "@/lib/catalog/validation";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search", description: "Search " + brand.name + " products." };

export default async function SearchPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const query = catalogQuerySchema.safeParse(await searchParams);
  if (!query.success) notFound();
  return <CatalogListing query={query.data} search />;
}
