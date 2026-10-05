import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Wordmark } from "@/components/layout/wordmark";
import { brand } from "@/lib/brand";

const footerLink = "inline-flex min-h-11 items-center text-sm hover:underline underline-offset-4";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-[var(--home-field)] text-[var(--home-text)] [--ring:var(--home-text)] motion-safe:transition-colors motion-safe:duration-700">
      <Container className="grid gap-8 py-12 sm:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="text-base"><Wordmark variant="footer" className="sm:pl-0" /></p>
          <p className="max-w-xs text-sm leading-relaxed opacity-80">{brand.footerBlurb}</p>
        </div>
        <nav aria-label="Shop" className="flex flex-col">
          <p className="eyebrow mb-1 text-xs opacity-75">Shop</p>
          <Link href="/shop" className={footerLink}>Shop all</Link>
          <Link href="/search" className={footerLink}>Search</Link>
        </nav>
        <nav aria-label="Your account" className="flex flex-col">
          <p className="eyebrow mb-1 text-xs opacity-75">Help</p>
          <Link href="/cart" className={footerLink}>Cart</Link>
          <Link href="/account" className={footerLink}>Account</Link>
          <a href="#top" className={footerLink}>Back to top</a>
        </nav>
      </Container>
    </footer>
  );
}
