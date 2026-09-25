"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { changeCart } from "@/lib/cart/actions";
import type { CartState } from "@/lib/cart/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CartForm({ variantId, quantity = 1, operation, disabled = false }: {
  variantId: string; quantity?: number; operation: "add" | "set" | "remove"; disabled?: boolean;
}) {
  const [state, action, pending] = useActionState<CartState, FormData>(changeCart, {});
  const id = useId();
  const label = operation === "add" ? "Add to cart" : operation === "set" ? "Update quantity" : "Remove";
  return (
    <form action={action} aria-label={label} aria-busy={pending} className="space-y-3">
      <input type="hidden" name="variantId" value={variantId} />
      <input type="hidden" name="operation" value={operation} />
      <fieldset disabled={pending || disabled} className="min-w-0 space-y-3">
        <legend className="sr-only">{label}</legend>
        {operation !== "remove" && <div className="space-y-2">
          <Label htmlFor={id}>Quantity</Label>
          <Input id={id} name="quantity" type="number" min={1} max={2147483647} step={1}
            required defaultValue={quantity} aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? id + "-status" : undefined} className="max-w-32" />
        </div>}
        <Button type="submit" variant={operation === "remove" ? "outline" : "default"}>
          {pending ? "Please wait..." : label}
        </Button>
      </fieldset>
      <div id={id + "-status"} aria-live="polite" aria-atomic="true" className="text-sm">
        {state.error && <p role="alert" className="text-destructive">{state.error}</p>}
        {state.message && <p>{state.message} {operation === "add" && <Link href="/cart" className="underline underline-offset-4">View cart</Link>}</p>}
      </div>
    </form>
  );
}
