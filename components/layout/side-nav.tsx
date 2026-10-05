"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** `match` lists extra path prefixes that belong to the item (e.g. order pages under Orders). */
export type SideNavLink = { href: string; label: string; exact?: boolean; match?: string[] };

// A horizontal scrolling row on small screens, a vertical list from lg up.
export function SideNav({ label, links }: { label: string; links: SideNavLink[] }) {
  const pathname = usePathname();
  const isCurrent = (link: SideNavLink) => link.exact ? pathname === link.href
    : [link.href, ...(link.match ?? [])].some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
  return <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
    <ul className="flex gap-6 border-b border-border lg:flex-col lg:gap-0 lg:border-b-0 lg:border-l">
      {links.map((link) => {
        const current = isCurrent(link);
        return <li key={link.href} className="shrink-0">
          <Link href={link.href} aria-current={current ? "page" : undefined}
            className={cn("eyebrow -mb-px inline-flex min-h-11 items-center border-b-2 border-transparent text-xs text-muted-foreground hover:text-foreground lg:-ml-px lg:mb-0 lg:w-full lg:border-b-0 lg:border-l-2 lg:pl-4",
              current && "border-foreground font-semibold text-foreground")}>{link.label}</Link>
        </li>;
      })}
    </ul>
  </nav>;
}
