"use client";

import { startTransition, useActionState, useId, useState } from "react";
import { CART_CHANGED } from "@/components/layout/cart-link";
import { changeCart } from "@/lib/cart/actions";
import type { CartState } from "@/lib/cart/validation";
import { cn } from "@/lib/utils";

// Same server action as CartForm; the header badge refreshes once the server confirms the change.
async function changeCartAndNotify(previous: CartState, form: FormData): Promise<CartState> {
  const result = await changeCart(previous, form);
  if (result.message) window.dispatchEvent(new Event(CART_CHANGED));
  return result;
}

function useCartChange(variantId: string) {
  const [state, action, pending] = useActionState<CartState, FormData>(changeCartAndNotify, {});
  const submit = (operation: "set" | "remove", quantity?: number) => {
    const form = new FormData();
    form.set("variantId", variantId);
    form.set("operation", operation);
    if (quantity !== undefined) form.set("quantity", String(quantity));
    startTransition(() => action(form));
  };
  return { state, pending, submit };
}

const stepButton = "flex size-11 items-center justify-center text-lg text-foreground hover:bg-accent disabled:pointer-events-none disabled:text-[#9aa0b2]";

/** − [qty] + control. Each step or a typed quantity (on Enter or leaving the field) updates the cart right away. */
export function QuantityStepper({ variantId, quantity, productLabel, disabled = false }: {
  variantId: string; quantity: number; productLabel: string; disabled?: boolean;
}) {
  const { state, pending, submit } = useCartChange(variantId);
  const [draft, setDraft] = useState(String(quantity));
  const id = useId();
  const commit = () => {
    const next = Number(draft);
    if (!/^[1-9]\d*$/.test(draft) || next > 2147483647) { setDraft(String(quantity)); return; }
    if (next !== quantity) submit("set", next);
  };
  return (
    <div className="space-y-1.5">
      <div role="group" aria-label={"Quantity for " + productLabel} aria-busy={pending}
        className={cn("inline-flex items-center rounded-sm border border-input", (pending || disabled) && "opacity-60")}>
        <button type="button" className={stepButton} aria-label="Decrease quantity"
          disabled={pending || disabled || quantity <= 1} onClick={() => submit("set", quantity - 1)}>
          <span aria-hidden="true">−</span>
        </button>
        <label htmlFor={id} className="sr-only">Quantity</label>
        <input id={id} inputMode="numeric" pattern="[0-9]*" value={draft} disabled={pending || disabled}
          aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? id + "-error" : undefined}
          onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 10))}
          onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commit(); } }}
          className="h-11 w-12 border-x border-input bg-background text-center text-base tabular-nums text-foreground disabled:bg-muted" />
        <button type="button" className={stepButton} aria-label="Increase quantity"
          disabled={pending || disabled} onClick={() => submit("set", quantity + 1)}>
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <p aria-live="polite" className="text-sm">
        {pending && <span className="text-muted-foreground">Updating…</span>}
        {!pending && state.error && <span id={id + "-error"} role="alert" className="text-destructive">{state.error}</span>}
      </p>
    </div>
  );
}

export function RemoveItemButton({ variantId, productLabel }: { variantId: string; productLabel: string }) {
  const { state, pending, submit } = useCartChange(variantId);
  return (
    <div className="space-y-1">
      <button type="button" disabled={pending} onClick={() => submit("remove")} aria-label={"Remove " + productLabel}
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-60">
        {pending ? "Removing…" : "Remove"}
      </button>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
