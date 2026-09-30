import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { StockForm } from "@/components/admin/forms";
import { Container } from "@/components/layout/container";
import { listInventory } from "@/lib/admin/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory | Admin | Atleteka" };

export default async function AdminInventoryPage() {
  const variants = await listInventory();
  return <Container className="space-y-8 py-10">
    <AdminNav />
    <h1 className="text-3xl font-semibold">Inventory</h1>
    <p className="text-sm text-muted-foreground">Set the number on hand for each option. If stock changed since this page loaded (for example, a sale), the save is refused so nothing is overwritten.</p>
    {variants.length === 0 ? <p role="status">No product options yet.</p> : <ul className="space-y-4">
      {variants.map((variant) => <li key={variant.id} className="space-y-2 rounded-lg border border-border p-4">
        <p className="break-words"><Link href={`/admin/products/${variant.products.id}`} className="font-medium underline underline-offset-4">{variant.products.name}</Link>
          {" · "}{variant.title} · SKU {variant.sku}</p>
        <p className="text-sm text-muted-foreground">
          On hand: {variant.inventory ?? "no stock row"}
          {!variant.active || variant.products.status !== "active" ? " · not for sale (option or product inactive)" : ""}
        </p>
        <StockForm variantId={variant.id} current={variant.inventory} label={`${variant.products.name} ${variant.title}`} />
      </li>)}
    </ul>}
  </Container>;
}
