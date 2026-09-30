import { z } from "zod";

// M12-P01. The database function enforces the same steps; this copy only drives the UI.
export const orderStatuses = ["needs_review", "unfulfilled", "shipped", "delivered", "cancelled"] as const;
export const orderStatusSchema = z.enum(orderStatuses);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderStatusLabel: Record<OrderStatus, string> = {
  needs_review: "Under review", unfulfilled: "To ship", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};
// Customers see "Processing" rather than the internal "To ship".
export const customerStatusLabel = (status: OrderStatus) => status === "unfulfilled" ? "Processing" : orderStatusLabel[status];

export const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  needs_review: ["unfulfilled", "cancelled"],
  unfulfilled: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
