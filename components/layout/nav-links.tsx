"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string; className?: string };

// Marks the section the visitor is in (visually and with aria-current) so navigation shows "you are here".
export function NavLinks({ links, className }: { links: NavLink[]; className: string }) {
  const pathname = usePathname();
  return links.map((link) => {
    const current = pathname === link.href || (link.href !== "/shop" && pathname.startsWith(link.href + "/"));
    return <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}
      className={cn(className, link.className, current && "underline decoration-2 underline-offset-[6px]")}>{link.label}</Link>;
  });
}
