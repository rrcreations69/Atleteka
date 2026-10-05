import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/orders/status";

const tone: Record<OrderStatus, string> = {
  needs_review: "border-destructive text-destructive",
  unfulfilled: "border-input text-foreground",
  shipped: "border-navy bg-navy text-white",
  delivered: "border-success text-success",
  cancelled: "border-border bg-card text-muted-foreground",
};

export function StatusBadge({ status, label, className }: { status: OrderStatus; label: string; className?: string }) {
  return <span className={cn("eyebrow inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold", tone[status], className)}>{label}</span>;
}
