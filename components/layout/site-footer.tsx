import Link from "next/link";
import { Container } from "@/components/layout/container";

const footerLink = "inline-flex min-h-11 items-center hover:underline underline-offset-4";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-secondary text-secondary-foreground">
      <Container className="grid gap-8 py-12 sm:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-2">
          <p className="font-serif text-2xl font-semibold [font-variation-settings:'SOFT'_100]">Atleteka</p>
          <p className="max-w-xs text-sm leading-relaxed text-[#cfc3b2]">Comfortable, well-made clothing for women and men. Philippines · PHP.</p>
        </div>
        <nav aria-label="Shop" className="flex flex-col text-[0.95rem]">
          <p className="mb-1 font-semibold">Shop</p>
          <Link href="/shop" className={footerLink}>Shop all</Link>
          <Link href="/search" className={footerLink}>Search</Link>
        </nav>
        <nav aria-label="Your account" className="flex flex-col text-[0.95rem]">
          <p className="mb-1 font-semibold">Help</p>
          <Link href="/cart" className={footerLink}>Cart</Link>
          <Link href="/account" className={footerLink}>Account</Link>
          <a href="#top" className={footerLink}>Back to top</a>
        </nav>
      </Container>
    </footer>
  );
}
