import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";

export default function CatalogNotFound() {
  return (
    <Container className="max-w-2xl py-16 text-center">
      <h1 className="text-3xl">This page is unavailable</h1>
      <p className="my-5 text-muted-foreground">The product, category or page could not be found.</p>
      <Link href="/shop" className={buttonVariants()}>Browse the shop</Link>
    </Container>
  );
}
