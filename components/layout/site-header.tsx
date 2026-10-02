import Link from "next/link";
import { Container } from "@/components/layout/container";
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

const iconLink = "inline-flex size-11 items-center justify-center rounded-full hover:bg-accent";
const navLink = "inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-[0.95rem] font-semibold hover:bg-accent";

export async function SiteHeader() {
  const categories = await navCategories();
  const links = [...categories.map((category) => ({ href: `/categories/${category.slug}`, label: category.name })), { href: "/shop", label: "Shop all" }];
  return (
    <header id="top" className="bg-background">
      <p className="bg-success px-4 py-2 text-center text-sm font-medium text-background">Delivery nationwide · Shipping paid to the courier on delivery</p>
      <Container className="grid min-h-18 grid-cols-[1fr_auto] items-center gap-4 py-3 lg:grid-cols-[1fr_auto_1fr]">
        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {links.map((link) => <Link key={link.href} href={link.href} className={navLink}>{link.label}</Link>)}
        </nav>
        <Link href="/" aria-label="Atleteka home" className="inline-flex min-h-11 items-center font-serif text-[1.75rem] font-semibold [font-variation-settings:'SOFT'_100] lg:justify-self-center">
          Atleteka
        </Link>
        <div className="flex items-center justify-end gap-1">
          <Link href="/search" aria-label="Search" className={iconLink}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          </Link>
          <Link href="/account" aria-label="Account" className={iconLink}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
          </Link>
          <Link href="/cart" aria-label="Cart" className={iconLink}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1.2 12H6.2L5 8z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
          </Link>
        </div>
      </Container>
      <nav aria-label="Shop by category" className="lg:hidden">
        <Container className="flex gap-1 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => <Link key={link.href} href={link.href} className={navLink + " bg-card"}>{link.label}</Link>)}
        </Container>
      </nav>
    </header>
  );
}
