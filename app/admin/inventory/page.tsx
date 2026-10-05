import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-nav";
import { StockForm } from "@/components/admin/forms";
import { listInventory } from "@/lib/admin/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory | Admin | Atleteka" };

export default async function AdminInventoryPage() {
  const variants = await listInventory();
  return <AdminShell title="Inventory" description={<p>Set the number on hand for each option. If stock changed since this page loaded (for example, a sale), the save is refused so nothing is overwritten.</p>}>
    {variants.length === 0 ? <p role="status" className="bg-card px-6 py-12 text-center text-muted-foreground">No product options yet.</p>
      : <ul className="border-t border-border">
        {variants.map((variant) => {
          const forSale = variant.active && variant.products.status === "active";
          const out = forSale && !variant.inventory;
          return <li key={variant.id} className="grid gap-3 border-b border-border py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center sm:px-3">
            <div className="min-w-0 space-y-1">
              <p className="break-words"><Link href={"/admin/products/" + variant.products.id} className="font-semibold underline-offset-4 hover:underline">{variant.products.name}</Link>
                <span className="text-muted-foreground"> · {variant.title}</span></p>
              <p className="break-words text-sm text-muted-foreground">
                SKU {variant.sku} · On hand: <span className={out ? "font-semibold text-destructive" : "font-semibold text-foreground"}>{variant.inventory ?? "no stock row"}</span>
                {!forSale ? " · not for sale (option or product inactive)" : ""}
              </p>
            </div>
            <StockForm variantId={variant.id} current={variant.inventory} label={variant.products.name + " " + variant.title} />
          </li>;
        })}
      </ul>}
  </AdminShell>;
}
