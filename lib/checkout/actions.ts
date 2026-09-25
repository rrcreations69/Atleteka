"use server";

import { revalidatePath } from "next/cache";
import { CartAccessError, createCartClient } from "@/lib/cart/data";
import { saveAddress } from "./data";
import { addressSchema, parseCheckoutForm, quoteError, quoteSchema, type CheckoutState } from "./validation";

export async function calculateCheckout(_state: CheckoutState, form: FormData): Promise<CheckoutState> {
  const input = parseCheckoutForm(form);
  if (!input.success) return { error: "Check the highlighted fields.", errors: input.errors };
  try {
    const { client, kind } = await createCartClient();
    const { data, error } = await client.rpc("checkout_quote", { coupon_code: input.data.couponCode || null });
    if (error) return { error: quoteError(error.code), ...(error.code === "P7003" ? { errors: { couponCode: quoteError(error.code) } } : {}) };
    const quote = quoteSchema.parse(data);
    if (kind === "account") {
      try { await saveAddress(client, addressSchema.parse(input.data)); }
      catch { return { error: "Your address could not be saved. Please try again." }; }
      revalidatePath("/checkout");
    }
    return { quote, message: kind === "account" ? "Address saved to your account. Merchandise total updated." : "Address checked. Merchandise total updated." };
  } catch (error) {
    return { error: error instanceof CartAccessError ? error.message : "We could not calculate your total. Please try again." };
  }
}
