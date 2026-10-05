"use client";

import { useActionState, useState } from "react";
import { calculateCheckout } from "@/lib/checkout/actions";
import { startPayment } from "@/lib/payment/actions";
import { type Address, type CheckoutState, type Quote, type SavedAddress } from "@/lib/checkout/validation";
import { formatPrice, type CatalogImage } from "@/lib/catalog/validation";
import { ProductImage } from "@/components/catalog/product-image";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const blank: Address = { name: "", line1: "", line2: "", city: "", region: "", postal_code: "", country: "PH" };
// [field, label, autocomplete, max length, spans both columns on wider screens]
const fields = [
  ["name", "Full name", "name", 120, true], ["line1", "Street address", "address-line1", 200, true],
  ["line2", "Apartment, building, etc. (optional)", "address-line2", 200, true],
  ["city", "City / municipality", "address-level2", 100, false], ["region", "Province / region", "address-level1", 100, false],
  ["postal_code", "Postal code", "postal-code", 4, false],
] as const;

export function CheckoutForm({ initialQuote, addresses, account, thumbnails }: {
  initialQuote: Quote; addresses: SavedAddress[]; account: boolean; thumbnails: Record<string, CatalogImage>;
}) {
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
  // Paying requires a total confirmed with the current form; the server re-quotes regardless.
  const canPay = Boolean(state.quote) && !dirty && !pending;
  const busy = pending || paying;
  const count = quote.cart.items.reduce((total, item) => total + item.quantity, 0);
  const discounted = Number(quote.discountTotal) > 0;
  return <form action={action} aria-describedby="checkout-status" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
    <fieldset disabled={busy} aria-labelledby="delivery-heading" className="min-w-0 space-y-6">
      <div className="space-y-2 border-b border-border pb-5">
        <h2 id="delivery-heading" className="text-xl">Delivery address</h2>
        <p className="text-sm text-muted-foreground">Delivery within the Philippines only. This address is also used for billing.
          {account ? " It is saved to your account when you confirm your total." : " As a guest, it is kept in this form for this visit."}</p>
      </div>
      {account && addresses.length > 0 && <div className="space-y-2">
        <Label htmlFor="saved-address">Use a saved address</Label>
        <select id="saved-address" value={selected} className="min-h-12 w-full min-w-0 rounded-sm border border-input bg-field px-4"
          onChange={(event) => {
            setSelected(event.target.value);
            setAddress(addresses.find((item) => item.id === event.target.value) ?? blank);
            setDirty(true);
          }}>
          <option value="">Enter a new address</option>
          {addresses.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.line1}, {item.city}</option>)}
        </select>
      </div>}
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map(([key, label, autoComplete, maxLength, wide]) => <div key={key} className={wide ? "sm:col-span-2" : undefined}>
          <TextField id={"checkout-" + key}
            name={key} label={label} autoComplete={autoComplete} maxLength={maxLength}
            required={key !== "line2"} value={address[key]} error={state.errors?.[key]}
            inputMode={key === "postal_code" ? "numeric" : undefined}
            pattern={key === "postal_code" ? "[0-9]{4}" : undefined}
            onChange={(event) => { setAddress({ ...address, [key]: event.target.value }); setSelected(""); setDirty(true); }} />
        </div>)}
        <TextField id="checkout-country-display" label="Country" value="Philippines" readOnly autoComplete="country-name" />
      </div>
      <input type="hidden" name="country" value="PH" />
      {state.errors?.country && <p role="alert" className="text-sm text-destructive">{state.errors.country}</p>}
    </fieldset>

    <section aria-labelledby="checkout-summary" className="min-w-0 self-start lg:sticky lg:top-8">
      <div className="space-y-5 bg-card p-5 sm:p-6">
        <h2 id="checkout-summary" className="text-lg">Order summary <span className="text-muted-foreground">({count} {count === 1 ? "item" : "items"})</span></h2>
        <ul className="space-y-4">
          {quote.cart.items.map((item) => <li key={item.variantId} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-start gap-x-4">
            <div className="relative">
              <ProductImage image={item.productSlug ? thumbnails[item.productSlug] : undefined} sizes="56px" className="[&_div]:p-1 [&_div]:text-[0.75rem]" />
              <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-xs font-semibold leading-5 text-white">
                <span className="sr-only">Quantity </span>{item.quantity}
              </span>
            </div>
            <div className="min-w-0 text-sm">
              <p className="break-words font-semibold">{item.productName}</p>
              <p className="break-words text-muted-foreground">{item.variantName}</p>
            </div>
            <p className="text-sm tabular-nums">{item.lineTotal === null ? "Unavailable" : formatPrice(item.lineTotal)}</p>
          </li>)}
        </ul>

        <fieldset disabled={busy} className="space-y-2 border-t border-border pt-5">
          <legend className="sr-only">Coupon</legend>
          <Label htmlFor="checkout-coupon">Coupon code <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <div className="flex gap-2">
            <Input id="checkout-coupon" name="couponCode" maxLength={100} value={coupon} autoComplete="off"
              aria-invalid={state.errors?.couponCode ? true : undefined} aria-describedby="checkout-coupon-help"
              onChange={(event) => { setCoupon(event.target.value); setDirty(true); }} />
            {/* Applying a coupon runs the same server total check as Confirm. */}
            <Button type="submit" variant="outline" className="shrink-0 px-5">Apply</Button>
          </div>
          <p id="checkout-coupon-help" className={cn("text-xs", state.errors?.couponCode ? "text-destructive" : "text-muted-foreground")}>
            {state.errors?.couponCode ?? "One code per order. Codes are case-sensitive."}</p>
        </fieldset>

        <dl className="space-y-3 border-t border-border pt-5 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatPrice(quote.subtotal)}</dd></div>
          {discounted && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Discount{quote.couponCode ? " (" + quote.couponCode + ")" : ""}</dt><dd className="tabular-nums text-success">−{formatPrice(quote.discountTotal)}</dd></div>}
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Shipping</dt><dd className="text-right">Paid to the courier on delivery</dd></div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4 text-base font-semibold"><dt>Total due now</dt><dd className="text-xl tabular-nums">{formatPrice(quote.merchandiseTotal)}</dd></div>
        </dl>
        <p className="text-xs text-muted-foreground">Prices include tax.</p>

        <div className="space-y-3">
          {canPay
            ? <>
              <input type="hidden" name="expectedTotal" value={quote.merchandiseTotal} />
              <Button type="submit" formAction={payAction} disabled={busy} className="w-full">{paying ? "Opening secure payment…" : "Pay " + formatPrice(quote.merchandiseTotal)}</Button>
            </>
            : <Button type="submit" disabled={busy} className="w-full">{pending ? "Checking…" : "Confirm address and total"}</Button>}
          <div id="checkout-status" role="status" aria-live="polite" className="space-y-2 text-sm">
            {pending ? <p>Checking prices, availability and coupon…</p> : paying ? <p>Rechecking your cart and opening PayMongo…</p> : <>
              {paymentError && <p className="text-destructive">{paymentError}</p>}
              {state.error && state.error !== state.errors?.couponCode && <p className="text-destructive">{state.error}</p>}
              {!dirty && !paymentError && state.message && <p className="flex gap-2"><span aria-hidden="true" className="text-success">✓</span>{state.message}</p>}
              {dirty && <p>Your details changed. Confirm your total again before paying.</p>}
            </>}
          </div>
        </div>
      </div>
      <div className="space-y-2 px-1 pt-4 text-xs text-muted-foreground">
        <p>Secure payment by card, QR Ph or e-wallet via PayMongo. You pay the courier&apos;s shipping fee directly on delivery.</p>
        <p>Items and coupons are not reserved until payment is confirmed.</p>
      </div>
    </section>
  </form>;
}
