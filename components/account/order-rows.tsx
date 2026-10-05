import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { orderStatusLabel } from "@/lib/account/orders";
import { formatPrice } from "@/lib/catalog/validation";
import type { OrderStatus } from "@/lib/orders/status";

export const orderDate = (value: string, style: "medium" | "long" = "medium") =>
  new Intl.DateTimeFormat("en-PH", { dateStyle: style, timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
export const orderNumber = (id: string) => id.slice(0, 8).toUpperCase();

type OrderRow = { id: string; created_at: string; status: OrderStatus; grand_total: string; itemCount: number };

export function OrderRows({ orders }: { orders: OrderRow[] }) {
  return <ul className="border-t border-border">
    {orders.map((order) => <li key={order.id} className="border-b border-border">
      <Link href={"/order/" + order.id} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-4 hover:bg-accent sm:grid-cols-[minmax(0,1fr)_auto_9rem] sm:px-3">
        <span className="min-w-0">
          <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">Order {orderNumber(order.id)}</span>
          <span className="block text-sm text-muted-foreground">{orderDate(order.created_at)} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}</span>
        </span>
        <StatusBadge status={order.status} label={orderStatusLabel(order.status)} />
        <span className="col-span-2 flex items-center justify-between gap-3 font-semibold tabular-nums sm:col-span-1 sm:justify-end">
          <span className="text-sm font-normal text-muted-foreground sm:hidden">Total</span>
          <span className="flex items-center gap-3">{formatPrice(order.grand_total)}<span aria-hidden="true" className="text-muted-foreground">›</span></span>
        </span>
      </Link>
    </li>)}
  </ul>;
}
