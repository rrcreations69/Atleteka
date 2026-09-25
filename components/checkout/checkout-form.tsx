"use client";

import { useActionState, useState } from "react";
import { calculateCheckout } from "@/lib/checkout/actions";
import { startPayment } from "@/lib/payment/actions";
import { type Address, type CheckoutState, type Quote, type SavedAddress } from "@/lib/checkout/validation";
import { formatPrice } from "@/lib/catalog/validation";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const blank: Address = { name: "", line1: "", line2: "", city: "", region: "", postal_code: "", country: "PH" };
const fields = [
  ["name", "Full name", "name", 120], ["line1", "Street address", "address-line1", 200],
  ["line2", "Apartment, building, etc. (optional)", "address-line2", 200],
  ["city", "City / municipality", "address-level2", 100], ["region", "Province / region", "address-level1", 100],
  ["postal_code", "Postal code", "postal-code", 4],
] as const;

export function CheckoutForm({ initialQuote, addresses, account }: { initialQuote: Quote; addresses: SavedAddress[]; account: boolean }) {
  const [address, setAddress] = useState<Address>(addresses[0] ?? blank);
  const [selected, setSelected] = useState(addresses[0]?.id ?? "");
  const [coupon, setCoupon] = useState("");
  const [dirty, setDirty] = useState(false);
  // A payment error belongs to the Pay attempt that produced it; a new total check clears it.
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [state, action, pending] = useActionState<CheckoutState, FormData>(async (previous, form) => {
    setPaymentError(null);
    const result = await calculateCheckout(previous, form);
    setDirty(false);
    return result;
  }, {});
  const [, payAction, paying] = useActionState<CheckoutState, FormData>(async (previous, form) => {
    const result = await startPayment(previous, form);
    setPaymentError(result.error ?? null);
    return result;
  }, {});
  const quote = !dirty && state.quote ? state.quote : initialQuote;
  // Paying requires a total checked with the current form; the server re-quotes regardless.
  const canPay = Boolean(state.quote) && !dirty && !pending;
  const busy = pending || paying;
  return <form action={action} aria-describedby="checkout-status" className="grid gap-8 lg:grid-cols-2">
    <fieldset disabled={busy} className="min-w-0 space-y-5">
      <legend className="mb-4 text-xl font-semibold">Shipping and billing address</legend>
      <p className="text-sm text-muted-foreground">Delivery within the Philippines only. This address is also used for billing.
        {account ? " Your address is saved to your account when you check the total." : " Your guest address is kept in this form for this visit."}</p>
      {account && addresses.length > 0 && <div className="space-y-2">
        <Label htmlFor="saved-address">Use a saved address</Label>
        <select id="saved-address" value={selected} className="min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3"
          onChange={(event) => {
            setSelected(event.target.value);
            setAddress(addresses.find((item) => item.id === event.target.value) ?? blank);
            setDirty(true);
          }}>
          <option value="">Enter a new address</option>
          {addresses.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.line1}, {item.city}</option>)}
        </select>
      </div>}
      {fields.map(([key, label, autoComplete, maxLength]) => <TextField key={key} id={"checkout-" + key}
        name={key} label={label} autoComplete={autoComplete} maxLength={maxLength}
        required={key !== "line2"} value={address[key]} error={state.errors?.[key]}
        inputMode={key === "postal_code" ? "numeric" : undefined}
        pattern={key === "postal_code" ? "[0-9]{4}" : undefined}
        onChange={(event) => { setAddress({ ...address, [key]: event.target.value }); setSelected(""); setDirty(true); }} />)}
      <TextField id="checkout-country-display" label="Country" value="Philippines" readOnly autoComplete="country-name" />
      <input type="hidden" name="country" value="PH" />
      {state.errors?.country && <p role="alert">{state.errors.country}</p>}
      <TextField id="checkout-coupon" name="couponCode" label="Coupon code (optional)" maxLength={100}
        description="One code per checkout. Codes are case-sensitive." value={coupon} error={state.errors?.couponCode}
        onChange={(event) => { setCoupon(event.target.value); setDirty(true); }} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant={canPay ? "outline" : "default"}>{pending ? "Checking…" : "Check merchandise total"}</Button>
        {canPay && <input type="hidden" name="expectedTotal" value={quote.merchandiseTotal} />}
        {canPay && <Button type="submit" formAction={payAction}>{paying ? "Opening secure payment…" : "Pay " + formatPrice(quote.merchandiseTotal)}</Button>}
      </div>
      <div id="checkout-status" role="status" aria-live="polite" className="space-y-2 text-sm">
        {pending ? <p>Checking prices, availability and coupon…</p> : paying ? <p>Rechecking your cart and opening PayMongo…</p> : <>
          {paymentError && <p className="text-destructive">{paymentError}</p>}
          {state.error && <p className="text-destructive">{state.error}</p>}
          {!dirty && !paymentError && state.message && <p>{state.message}</p>}
          {dirty && <p>Check the total again to apply your changes.</p>}
        </>}
      </div>
    </fieldset>
    <section aria-labelledby="checkout-summary" className="min-w-0 space-y-5 rounded-lg border border-border p-5">
      <h2 id="checkout-summary" className="text-xl font-semibold">Merchandise summary</h2>
      <ul className="space-y-3">
        {quote.cart.items.map((item) => <li key={item.variantId} className="break-words">
          <p>{item.productName} · {item.variantName} × {item.quantity}</p>
          <p>{formatPrice(item.lineTotal ?? "0")}</p>
        </li>)}
      </ul>
      <dl className="space-y-3 border-t border-border pt-4">
        <div><dt>Subtotal</dt><dd>{formatPrice(quote.subtotal)}</dd></div>
        <div><dt>Discount{quote.couponCode ? " (" + quote.couponCode + ")" : ""}</dt><dd>{formatPrice(quote.discountTotal)}</dd></div>
        <div className="font-semibold"><dt>Merchandise total after discounts</dt><dd>{formatPrice(quote.merchandiseTotal)}</dd></div>
        <div><dt>Tax</dt><dd>Included in prices</dd></div>
        <div><dt>Shipping</dt><dd>Paid to the courier on delivery (not included)</dd></div>
        <div className="font-semibold"><dt>Amount charged now</dt><dd>{formatPrice(quote.merchandiseTotal)}</dd></div>
      </dl>
      <p className="text-sm text-muted-foreground">Online payment covers merchandise only. You pay the third-party courier&apos;s shipping fee directly on delivery. Items and coupons are not reserved until payment is confirmed.</p>
    </section>
  </form>;
}
