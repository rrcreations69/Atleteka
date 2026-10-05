import type { ReactNode } from "react";
import { SectionShell } from "@/components/layout/section-shell";

export function AccountShell({ title, description, back, isAdmin, actions, children }: {
  title: string; description?: ReactNode; back?: { href: string; label: string }; isAdmin: boolean; actions?: ReactNode; children: ReactNode;
}) {
  return <SectionShell eyebrow="Your account" navLabel="Account" title={title} description={description} actions={actions} back={back} links={[
    { href: "/account", label: "Overview", exact: true },
    { href: "/account/orders", label: "Orders", match: ["/order"] },
    { href: "/account/addresses", label: "Addresses" },
    { href: "/account/settings", label: "Settings" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ]}>{children}</SectionShell>;
}
