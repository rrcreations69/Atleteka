import Link from "next/link";
import { Container } from "@/components/layout/container";

export default function CatalogNotFound() {
  return (
    <Container className="py-12">
      <h1 className="text-2xl font-semibold">This page is unavailable</h1>
      <p className="my-5 text-muted-foreground">The product, category or page could not be found.</p>
      <Link href="/shop" className="inline-flex min-h-11 items-center underline underline-offset-4">Browse the shop</Link>
    </Container>
  );
}
