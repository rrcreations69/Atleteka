import Link from "next/link";
import { AdminShell, adminWhen } from "@/components/admin/admin-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminOrders } from "@/lib/admin/orders";
import { formatPrice } from "@/lib/catalog/validation";
import { orderStatusLabel, orderStatusSchema, orderStatuses } from "@/lib/orders/status";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders | Admin | Atleteka" };

const tab = "eyebrow inline-flex min-h-11 shrink-0 items-center border-b-2 border-transparent text-xs text-muted-foreground hover:text-foreground";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const status = orderStatusSchema.safeParse((await searchParams).status).data ?? null;
  const orders = await listAdminOrders(status);
  return <AdminShell title="Orders" description={<p>{orders.length} {orders.length === 1 ? "order" : "orders"}{status ? " · " + orderStatusLabel[status] : ""}, newest first.</p>}>
    <nav aria-label="Filter orders by status" className="-mx-4 flex gap-x-6 overflow-x-auto px-4 shadow-[inset_0_-1px_0_var(--border)] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      <Link href="/admin/orders" aria-current={status === null ? "page" : undefined} className={cn(tab, status === null && "border-foreground font-semibold text-foreground")}>All</Link>
      {orderStatuses.map((value) => <Link key={value} href={"/admin/orders?status=" + value} aria-current={status === value ? "page" : undefined}
        className={cn(tab, status === value && "border-foreground font-semibold text-foreground")}>{orderStatusLabel[value]}</Link>)}
    </nav>
    {orders.length === 0 ? <p role="status" className="bg-card px-6 py-12 text-center text-muted-foreground">No orders{status ? " with status “" + orderStatusLabel[status] + "”" : ""}.</p>
      : <ul className="border-t border-border">
        {orders.map((order) => <li key={order.id} className="border-b border-border">
          <Link href={"/admin/orders/" + order.id} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-4 hover:bg-accent sm:grid-cols-[minmax(0,1fr)_auto_9rem] sm:px-3">
            <span className="min-w-0">
              <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">{order.id.slice(0, 8).toUpperCase()} <span className="font-normal text-muted-foreground">· {adminWhen(order.created_at)}</span></span>
              <span className="block break-all text-sm text-muted-foreground">{order.email}{order.user_id ? "" : " (guest)"} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}</span>
            </span>
            <StatusBadge status={order.status} label={orderStatusLabel[order.status]} />
            <span className="col-span-2 text-right font-semibold tabular-nums sm:col-span-1">{formatPrice(order.grand_total)}</span>
          </Link>
        </li>)}
      </ul>}
  </AdminShell>;
}
