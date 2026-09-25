import { notFound } from "next/navigation";
import { CatalogListing } from "@/components/catalog/catalog-listing";
import { catalogQuerySchema, type CatalogSearchParams } from "@/lib/catalog/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop | Atleteka", description: "Browse the Atleteka catalog." };

export default async function ShopPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const query = catalogQuerySchema.safeParse(await searchParams);
  if (!query.success) notFound();
  return <CatalogListing query={query.data} />;
}
