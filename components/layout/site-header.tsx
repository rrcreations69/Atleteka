import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CartLink } from "@/components/layout/cart-link";
import { NavLinks } from "@/components/layout/nav-links";
import { getCategories } from "@/lib/catalog/data";
import type { CatalogCategory } from "@/lib/catalog/validation";

// Women and Men lead the navigation when those categories exist; the rest follow by name.
const LEAD = ["women", "men"];
const MAX_NAV = 5;

async function navCategories(): Promise<CatalogCategory[]> {
  try {
    const categories = await getCategories();
    const rank = (slug: string) => (LEAD.includes(slug) ? LEAD.indexOf(slug) : LEAD.length);
    return [...categories].sort((a, b) => rank(a.slug) - rank(b.slug)).slice(0, MAX_NAV);
  } catch {
    // Navigation must not take the page down; "Shop all" still works.
    return [];
  }
}

const iconLink = "inline-flex size-11 items-center justify-center hover:opacity-70";
const navLink = "eyebrow inline-flex min-h-11 shrink-0 items-center text-xs hover:underline hover:underline-offset-[6px]";

export async function SiteHeader() {
  const categories = await navCategories();
  const home = { href: "/", label: "Home" };
  const shopAll = { href: "/shop", label: "Shop all" };
  const categoryLinks = categories.map((category) => ({ href: `/categories/${category.slug}`, label: category.name }));
  return (
    <header id="top" className="border-b border-border bg-background">
      <p className="eyebrow bg-foreground px-4 py-2.5 text-center text-xs font-medium text-apricot">Nationwide delivery · Shipping paid on delivery</p>
      <Container className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-4 py-2 lg:grid-cols-[1fr_auto_1fr]">
        <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
          {/* Desktop shows two categories (three from xl) so the centered logo never collides. */}
          <NavLinks links={[home, ...categoryLinks.slice(0, 3).map((link, index) => index === 2 ? { ...link, className: "hidden xl:inline-flex" } : link), shopAll]} className={navLink} />
        </nav>
        <Link href="/" aria-label="Atleteka home" className="inline-flex min-h-11 items-center pl-[0.32em] text-lg font-bold uppercase tracking-[0.32em] lg:justify-self-center">
          Atleteka
        </Link>
        <div className="flex items-center justify-end">
          <Link href="/search" aria-label="Search" className={iconLink}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          </Link>
          <Link href="/account" aria-label="Account" className={iconLink}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
          </Link>
          <CartLink className={iconLink} />
        </div>
      </Container>
      <nav aria-label="Shop by category" className="border-t border-border lg:hidden">
        {/* The fade at the right edge hints that the row scrolls sideways. */}
        <Container className="flex gap-6 overflow-x-auto pr-10 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavLinks links={[home, ...categoryLinks, shopAll]} className={navLink} />
        </Container>
      </nav>
    </header>
  );
}
