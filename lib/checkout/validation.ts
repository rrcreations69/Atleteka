import { z } from "zod";
import { cartSchema } from "../cart/validation";

const text = (max: number) => z.string().trim().min(1, "This field is required.").max(max, "This field is too long.");
export const addressSchema = z.object({
  name: text(120), line1: text(200), line2: z.string().trim().max(200),
  city: text(100), region: text(100),
  postal_code: z.string().trim().regex(/^\d{4}$/, "Enter a four-digit Philippine postal code."),
  country: z.literal("PH", { error: "Delivery is available within the Philippines only." }),
});
export const savedAddressSchema = addressSchema.extend({ id: z.uuid() });
export type Address = z.infer<typeof addressSchema>;
export type SavedAddress = z.infer<typeof savedAddressSchema>;
export const checkoutInputSchema = addressSchema.extend({
  couponCode: z.string().trim().max(100, "Coupon code is too long."),
});
export const checkoutFields = ["name", "line1", "line2", "city", "region", "postal_code", "country", "couponCode"] as const;
export function parseCheckoutForm(form: FormData) {
  const input: Record<string, FormDataEntryValue | null> = {};
  for (const key of checkoutFields) {
    if (form.getAll(key).length > 1) return { success: false as const, errors: { [key]: "Submit one value for this field." } };
    input[key] = form.get(key) ?? (key === "line2" || key === "couponCode" ? "" : null);
  }
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { success: false as const, errors };
  }
  return { success: true as const, data: parsed.data };
}
const money = z.string().max(1000).regex(/^\d+(?:\.\d+)?$/);
export const quoteSchema = z.object({
  cart: cartSchema, currency: z.literal("PHP"), couponCode: z.string().max(100).nullable(),
  subtotal: money, discountTotal: money, merchandiseTotal: money,
  taxIncluded: z.literal(true), shippingTotal: z.null(), grandTotal: z.null(),
});
export type Quote = z.infer<typeof quoteSchema>;
export type CheckoutState = {
  error?: string; errors?: Record<string, string>; quote?: Quote; message?: string;
};
export function quoteError(code: string) {
  switch (code) {
    case "P7001": return "Your cart is empty. Add an item before checkout.";
    case "P7002": return "Some items are no longer available in the saved quantity. Update your cart before continuing.";
    case "P7003": return "This coupon is invalid, inactive, expired, or has reached its usage limit.";
    case "P7004": return "An item price cannot be calculated. Please contact the store.";
    default: return "We could not calculate your total. Please try again.";
  }
}
