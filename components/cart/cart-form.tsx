"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useState } from "react";
import { CART_CHANGED } from "@/components/layout/cart-link";
import { changeCart } from "@/lib/cart/actions";
import type { CartState } from "@/lib/cart/validation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CartForm({ variantId, quantity = 1, operation, disabled = false, itemLabel }: {
  variantId: string; quantity?: number; operation: "add" | "set" | "remove"; disabled?: boolean;
  /** Shown in the add-to-cart confirmation, e.g. "Heavyweight Crew Tee · M". */
  itemLabel?: string;
}) {
  const [state, action, pending] = useActionState<CartState, FormData>(changeCart, {});
  // The quantity actually submitted, for the confirmation summary.
  const [addedQuantity, setAddedQuantity] = useState(quantity);
  // Tell the header badge to refresh after a successful add, update or remove.
  useEffect(() => {
    if (state.message) window.dispatchEvent(new Event(CART_CHANGED));
  }, [state]);
  const id = useId();
  const label = operation === "add" ? "Add to cart" : operation === "set" ? "Update quantity" : "Remove";
  return (
    <form action={action} aria-label={label} aria-busy={pending} className="space-y-3"
      onSubmit={(event) => setAddedQuantity(Number(new FormData(event.currentTarget).get("quantity")) || 1)}>
      <input type="hidden" name="variantId" value={variantId} />
      <input type="hidden" name="operation" value={operation} />
      <fieldset disabled={pending || disabled} className="flex min-w-0 flex-wrap items-end gap-3">
        <legend className="sr-only">{label}</legend>
        {operation !== "remove" && <div className="space-y-1.5">
          <Label htmlFor={id}>Quantity</Label>
          <Input id={id} name="quantity" type="number" min={1} max={2147483647} step={1}
            required defaultValue={quantity} aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? id + "-status" : undefined} className="w-24" />
        </div>}
        <Button type="submit" variant={operation === "remove" ? "outline" : operation === "set" ? "secondary" : "default"} className={operation === "add" ? "min-w-48 flex-1" : undefined}>
          {pending ? "Please wait..." : label}
        </Button>
      </fieldset>
      <div id={id + "-status"} aria-live="polite" aria-atomic="true" className="text-sm">
        {state.error && <p role="alert" className="text-destructive">{state.error}</p>}
        {state.message && operation !== "add" && <p>{state.message}</p>}
        {state.message && operation === "add" && <AddedToCart itemLabel={itemLabel} quantity={addedQuantity} />}
      </div>
    </form>
  );
}

// Confirmation after adding: says what was added and offers the two likely next steps.
function AddedToCart({ itemLabel, quantity }: { itemLabel?: string; quantity: number }) {
  return (
    <div className="mt-1 border border-border bg-card p-4">
      <div className="flex gap-3">
        <svg aria-hidden="true" className="mt-0.5 shrink-0 text-success" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M7.5 12.5l3 3 6-6.5" />
        </svg>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">Added to your cart</p>
          {itemLabel && <p className="mt-0.5 break-words text-muted-foreground">{itemLabel} · Qty {quantity}</p>}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {/* Ink, not crimson: Add to cart stays the only crimson action in view. */}
        <Link href="/checkout" className={buttonVariants({ variant: "ink", className: "px-3" })}>Checkout</Link>
        <Link href="/cart" className={buttonVariants({ variant: "outline", className: "px-3" })}>View cart</Link>
      </div>
    </div>
  );
}
