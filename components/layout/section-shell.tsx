import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { SideNav, type SideNavLink } from "@/components/layout/side-nav";
import { logout } from "@/lib/auth/actions";

/** Page frame for signed-in areas (account, admin): side navigation, page heading and a sign-out action. */
export function SectionShell({ eyebrow, title, description, links, navLabel, actions, back, children }: {
  eyebrow: string; title: string; description?: ReactNode; links: SideNavLink[]; navLabel: string;
  actions?: ReactNode; back?: { href: string; label: string }; children: ReactNode;
}) {
  return <Container className="py-8 sm:py-12">
    <div className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-14">
      <aside className="min-w-0 space-y-6 lg:pt-1">
        <p className="eyebrow hidden text-xs text-muted-foreground lg:block">{eyebrow}</p>
        <SideNav label={navLabel} links={links} />
        <form action={logout} className="hidden lg:block">
          <button type="submit" className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">Sign out</button>
        </form>
      </aside>
      <div className="min-w-0 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-border pb-5">
          <div className="min-w-0 space-y-2">
            {back
              ? <Link href={back.href} className="eyebrow inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><span aria-hidden="true">←</span> {back.label}</Link>
              : <p className="eyebrow text-xs text-muted-foreground lg:hidden">{eyebrow}</p>}
            <h1 className="break-words text-3xl sm:text-4xl">{title}</h1>
            {description && <div className="text-sm text-muted-foreground">{description}</div>}
          </div>
          {actions}
        </div>
        {children}
        <form action={logout} className="border-t border-border pt-6 lg:hidden">
          <button type="submit" className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">Sign out</button>
        </form>
      </div>
    </div>
  </Container>;
}
