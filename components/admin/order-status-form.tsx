"use client";

import { useState } from "react";
import { ActionForm } from "@/components/admin/action-form";
import { Label } from "@/components/ui/label";
import { TextField } from "@/components/ui/text-field";
import { updateOrderStatus } from "@/lib/admin/actions";
import { orderStatusLabel, type OrderStatus } from "@/lib/orders/status";

export function OrderStatusForm({ orderId, next }: { orderId: string; next: OrderStatus[] }) {
  const [status, setStatus] = useState<OrderStatus>(next[0]);
  if (next.length === 0) return <p role="status">This order is final; its status can no longer change.</p>;
  return <ActionForm action={updateOrderStatus} submitLabel="Update status" pendingLabel="Updating…">
    {(errors) => <>
      <input type="hidden" name="orderId" value={orderId} />
      <div className="space-y-2"><Label htmlFor="order-next-status">Change status to</Label>
        <select id="order-next-status" name="status" value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)}
          className="min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3">
          {next.map((value) => <option key={value} value={value}>{orderStatusLabel[value]}</option>)}
        </select></div>
      {status === "shipped" && <>
        <TextField id="order-courier" name="courier" label="Courier (optional)" placeholder="e.g. LBC, J&T, Lalamove" maxLength={80} error={errors.courier} />
        <TextField id="order-tracking" name="trackingNumber" label="Tracking number (optional)" maxLength={100} error={errors.trackingNumber} />
      </>}
      {status === "cancelled" && <p className="text-sm text-muted-foreground">Cancelling does not refund the customer. Refund the payment in the PayMongo dashboard first.</p>}
    </>}
  </ActionForm>;
}
