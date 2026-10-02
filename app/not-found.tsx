import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Page not found | Atleteka" };

export default function NotFound() {
  return (
    <Container className="max-w-2xl py-16 text-center sm:py-24">
      <h1 className="text-4xl sm:text-5xl">We couldn&apos;t find that page</h1>
      <p className="my-5 text-lg text-muted-foreground">The link may be old, or the page may have moved.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/shop" className={buttonVariants()}>Browse the shop</Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>Go home</Link>
      </div>
    </Container>
  );
}
