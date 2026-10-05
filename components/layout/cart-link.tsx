"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCartCount } from "@/lib/cart/actions";

export const CART_CHANGED = "atleteka:cart-changed";

// Header cart icon with an item-count badge. The count loads after the page (so pages stay
// cacheable) and refreshes on navigation, when the tab regains focus and after any cart change.
export function CartLink({ className }: { className: string }) {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    const refresh = () => { getCartCount().then((value) => { if (alive) setCount(value); }, () => {}); };
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    refresh();
    window.addEventListener(CART_CHANGED, refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => { alive = false; window.removeEventListener(CART_CHANGED, refresh); document.removeEventListener("visibilitychange", onVisible); };
  }, [pathname]);

  const label = count === 0 ? "Cart" : `Cart, ${count} ${count === 1 ? "item" : "items"}`;
  return (
    <Link href="/cart" aria-label={label} className={className + " relative"}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 8h14v13H5z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
      {count > 0 && <span aria-hidden="true" className="absolute right-0 top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold leading-none text-primary-foreground tabular-nums">
        {count > 99 ? "99+" : count}
      </span>}
    </Link>
  );
}
