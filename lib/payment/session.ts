import type { Quote } from "../checkout/validation";

// PayMongo minimum for cards and e-wallets is PHP 1.00 (docs.paymongo.com, payment acceptance key concepts), in centavos.
export const MINIMUM_CHARGE = 100;
// PayMongo amounts are integers in centavos; keep well inside the per-transaction card limit.
const MAXIMUM_AMOUNT = 99_999_999;

export class PaymentQuoteError extends Error {}

/** Exact decimal string to centavos. More than two decimals would need rounding, so it fails closed. */
export function toCentavos(value: string) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) throw new PaymentQuoteError("Amount is not an exact PHP value.");
  const centavos = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(centavos) || centavos > MAXIMUM_AMOUNT) throw new PaymentQuoteError("Amount is out of range.");
  return centavos;
}

export type PaymentLine = { variantId: string; name: string; unitAmount: number; quantity: number };
export type PaymentPlan = { lines: PaymentLine[]; subtotal: number; discount: number; total: number; couponCode: string | null };

/** Turns a server quote into PayMongo amounts (centavos), re-checking every total the quote reports. */
export function planPayment(quote: Quote): PaymentPlan {
  if (!quote.cart.id || quote.cart.items.length === 0) throw new PaymentQuoteError("Cart is empty.");
  const lines = quote.cart.items.map((item) => {
    if (!item.available || !item.quantityValid || item.unitPrice === null || item.lineTotal === null) {
      throw new PaymentQuoteError("An item is unavailable.");
    }
    const unitAmount = toCentavos(item.unitPrice);
    if (unitAmount * item.quantity !== toCentavos(item.lineTotal)) throw new PaymentQuoteError("Line total does not match.");
    return { variantId: item.variantId, name: `${item.productName} · ${item.variantName}`, unitAmount, quantity: item.quantity };
  });
  const subtotal = toCentavos(quote.subtotal);
  const discount = toCentavos(quote.discountTotal);
  const total = toCentavos(quote.merchandiseTotal);
  if (lines.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0) !== subtotal) {
    throw new PaymentQuoteError("Subtotal does not match.");
  }
  if (discount > subtotal || subtotal - discount !== total) throw new PaymentQuoteError("Discount does not match.");
  if (total < MINIMUM_CHARGE) throw new PaymentQuoteError("Total is below the minimum charge.");
  return { lines, subtotal, discount, total, couponCode: quote.couponCode };
}

const DESCRIPTION_LIMIT = 255;
const peso = (centavos: number) => `PHP ${(centavos / 100).toFixed(2)}`;

/**
 * PayMongo has no coupon object and rejects negative lines. Without a discount the lines are itemized;
 * with one, a single line carries the exact discounted total so no per-item rounding is needed.
 */
export function checkoutLineItems(plan: PaymentPlan) {
  if (plan.discount === 0) {
    return plan.lines.map((line) => ({ name: line.name, amount: line.unitAmount, quantity: line.quantity, currency: "PHP" as const }));
  }
  const items = plan.lines.map((line) => `${line.name} × ${line.quantity}`).join(", ");
  const description = `${items}. Coupon ${plan.couponCode ?? ""} applied: −${peso(plan.discount)} from ${peso(plan.subtotal)}.`;
  return [{
    name: "Atleteka order (merchandise after discount)", amount: plan.total, quantity: 1, currency: "PHP" as const,
    description: description.length > DESCRIPTION_LIMIT ? description.slice(0, DESCRIPTION_LIMIT - 1) + "…" : description,
  }];
}
