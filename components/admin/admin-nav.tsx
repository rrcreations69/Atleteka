import type { ReactNode } from "react";
import { SectionShell } from "@/components/layout/section-shell";

/** Admin page frame: the shared signed-in layout with admin navigation. */
export function AdminShell({ title, description, actions, children }: {
  title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode;
}) {
  return <SectionShell eyebrow="Admin" navLabel="Admin" title={title} description={description} actions={actions} links={[
    { href: "/admin", label: "Dashboard", exact: true },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/inventory", label: "Inventory" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/account", label: "Your account", exact: true },
  ]}>{children}</SectionShell>;
}

export const adminPanel = "space-y-4 bg-card p-5 sm:p-6";
export const adminWhen = (value: string) =>
  new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
