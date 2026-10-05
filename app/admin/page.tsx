import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-nav";
import { listAdminProducts, listInventory } from "@/lib/admin/data";
import { listAdminOrders } from "@/lib/admin/orders";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | Atleteka" };

export default async function AdminPage() {
  const { user } = await requireAdmin();
  const [toShip, review, products, inventory] = await Promise.all([
    listAdminOrders("unfulfilled"), listAdminOrders("needs_review"), listAdminProducts(), listInventory(),
  ]);
  const forSale = inventory.filter((variant) => variant.active && variant.products.status === "active");
  const soldOut = forSale.filter((variant) => !variant.inventory).length;
  const tiles = [
    { label: "Orders to ship", value: toShip.length, href: "/admin/orders?status=unfulfilled", alert: false },
    { label: "Orders under review", value: review.length, href: "/admin/orders?status=needs_review", alert: review.length > 0 },
    { label: "Active products", value: products.filter((product) => product.status === "active").length, href: "/admin/products", alert: false },
    { label: "Options out of stock", value: soldOut, href: "/admin/inventory", alert: false },
  ];
  return <AdminShell title="Dashboard" description={<p className="break-all">Signed in as {user.email}</p>}>
    <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {tiles.map((tile) => <li key={tile.label}>
        <Link href={tile.href} className="group flex h-full flex-col justify-between gap-4 bg-card p-5 hover:bg-accent">
          <span className="text-sm text-muted-foreground group-hover:text-foreground">{tile.label}</span>
          <span className={tile.alert ? "text-3xl font-semibold tabular-nums text-destructive" : "text-3xl font-semibold tabular-nums"}>{tile.value}</span>
        </Link>
      </li>)}
    </ul>
    {review.length > 0 && <p role="status" className="border-l-2 border-destructive bg-card p-4 text-sm">
      {review.length === 1 ? "One order needs" : review.length + " orders need"} a check before shipping. <Link href="/admin/orders?status=needs_review" className="underline underline-offset-4">Review now</Link>
    </p>}
  </AdminShell>;
}
