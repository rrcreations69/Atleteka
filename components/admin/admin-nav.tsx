import Link from "next/link";

const links = [["/admin", "Admin home"], ["/admin/products", "Products"], ["/admin/categories", "Categories"], ["/admin/inventory", "Inventory"], ["/admin/orders", "Orders"]] as const;

export function AdminNav() {
  return <nav aria-label="Admin" className="flex flex-wrap gap-x-5 gap-y-1 border-b border-border pb-3">
    {links.map(([href, label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center underline underline-offset-4">{label}</Link>)}
  </nav>;
}
