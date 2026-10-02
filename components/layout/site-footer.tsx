import Link from "next/link";
import { Container } from "@/components/layout/container";

const footerLink = "inline-flex min-h-11 items-center text-sm hover:underline underline-offset-4";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-foreground text-background [--ring:var(--apricot)]">
      <Container className="grid gap-8 py-12 sm:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="pl-[0.32em] text-base font-bold uppercase tracking-[0.32em] sm:pl-0">Atleteka</p>
          <p className="max-w-xs text-sm leading-relaxed text-[#b9bdcb]">Everyday clothing for women and men, made to last. Philippines · PHP.</p>
        </div>
        <nav aria-label="Shop" className="flex flex-col">
          <p className="eyebrow mb-1 text-xs text-apricot">Shop</p>
          <Link href="/shop" className={footerLink}>Shop all</Link>
          <Link href="/search" className={footerLink}>Search</Link>
        </nav>
        <nav aria-label="Your account" className="flex flex-col">
          <p className="eyebrow mb-1 text-xs text-apricot">Help</p>
          <Link href="/cart" className={footerLink}>Cart</Link>
          <Link href="/account" className={footerLink}>Account</Link>
          <a href="#top" className={footerLink}>Back to top</a>
        </nav>
      </Container>
    </footer>
  );
}
