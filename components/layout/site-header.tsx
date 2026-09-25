import Link from "next/link";
import { Container } from "@/components/layout/container";

export function SiteHeader() {
  return (
    <header id="top" className="border-b border-border bg-background">
      <Container className="flex min-h-20 items-center justify-between gap-4 py-4">
        <Link
          href="/"
          aria-label="Atleteka home"
          className="inline-flex min-h-11 items-center rounded-sm text-xl font-semibold tracking-tight"
        >
          Atleteka
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1"><Link href="/shop" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Shop</Link><Link href="/search" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Search</Link><Link href="/cart" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Cart</Link><Link href="/account" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Account</Link></nav>
      </Container>
    </header>
  );
}
