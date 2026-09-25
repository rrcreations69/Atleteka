"use server";

import { redirect } from "next/navigation";
import { CartAccessError, createCartClient } from "@/lib/cart/data";
import { addressSchema, parseCheckoutForm, quoteError, quoteSchema, type CheckoutState } from "@/lib/checkout/validation";
import { getAuthConfig } from "@/lib/supabase/config";
import { createCheckoutSession } from "./paymongo";
import { checkoutLineItems, PaymentQuoteError, planPayment } from "./session";

export async function startPayment(_state: CheckoutState, form: FormData): Promise<CheckoutState> {
  const input = parseCheckoutForm(form);
  if (!input.success) return { error: "Check the highlighted fields.", errors: input.errors };
  const expected = form.getAll("expectedTotal");
  if (expected.length !== 1 || typeof expected[0] !== "string") return { error: "Check the merchandise total again before paying." };
  let url: string;
  try {
    const { client, kind } = await createCartClient();
    // Re-quote now: browser-supplied prices, totals and identity are never used.
    const { data, error } = await client.rpc("checkout_quote", { coupon_code: input.data.couponCode || null });
    if (error) return { error: quoteError(error.code), ...(error.code === "P7003" ? { errors: { couponCode: quoteError(error.code) } } : {}) };
    const quote = quoteSchema.parse(data);
    const plan = planPayment(quote, expected[0]);
    const address = addressSchema.parse(input.data);
    const user = kind === "account" ? (await client.auth.getUser()).data.user : null;
    if (kind === "account" && !user) throw new CartAccessError("Your session could not be verified. Sign in again.");
    const cartId = quote.cart.id ?? "";
    const { appUrl } = getAuthConfig();
    const session = await createCheckoutSession({
      line_items: checkoutLineItems(plan),
      description: "Atleteka merchandise. Shipping is not included: you pay the courier directly on delivery.",
      reference_number: cartId,
      // M09 re-reads these from the verified webhook payload; string values only.
      metadata: {
        cart_id: cartId, cart_kind: kind, user_id: user?.id ?? "",
        coupon_code: plan.couponCode ?? "", currency: "PHP",
        subtotal: quote.subtotal, discount_total: quote.discountTotal, merchandise_total: quote.merchandiseTotal,
        variant_ids: plan.lines.map((line) => `${line.variantId}:${line.quantity}`).join(","),
        shipping: "paid_to_courier_on_delivery",
      },
      billing: {
        name: address.name,
        ...(user?.email ? { email: user.email } : {}),
        address: {
          line1: address.line1, ...(address.line2 ? { line2: address.line2 } : {}), city: address.city,
          state: address.region, postal_code: address.postal_code, country: address.country,
        },
      },
      success_url: new URL("/checkout/success", appUrl).href,
      cancel_url: new URL("/checkout?payment=cancelled", appUrl).href,
    });
    url = session.url;
  } catch (error) {
    if (error instanceof CartAccessError) return { error: error.message };
    if (error instanceof PaymentQuoteError) {
      return { error: error.message === "Total is below the minimum charge."
        ? "This total is too low to pay online. Remove the coupon or add an item."
        : "Your cart changed. Check the merchandise total again before paying." };
    }
    return { error: "We could not start the payment. Please try again." };
  }
  redirect(url);
}
