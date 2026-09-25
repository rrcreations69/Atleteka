import test from "node:test";
import assert from "node:assert/strict";
const { MINIMUM_CHARGE, PaymentQuoteError, checkoutLineItems, planPayment, toCentavos } = await import("../lib/payment/session.ts");

const item = (patch = {}) => ({ variantId: "11111111-1111-4111-8111-111111111111", productSlug: "shirt", productName: "Shirt", variantName: "M",
 quantity: 2, unitPrice: "250.50", lineTotal: "501.00", available: true, quantityValid: true, ...patch });
const quote = (patch = {}) => ({ cart: { id: "22222222-2222-4222-8222-222222222222", items: [item()], subtotal: "501.00" },
 currency: "PHP", couponCode: null, subtotal: "501.00", discountTotal: "0", merchandiseTotal: "501.00",
 taxIncluded: true, shippingTotal: null, grandTotal: null, ...patch });

test("exact PHP strings convert to centavos without floating point", () => {
 assert.equal(toCentavos("0.1"), 10); assert.equal(toCentavos("250.50"), 25050); assert.equal(toCentavos("19.99"), 1999); assert.equal(toCentavos("7"), 700);
 for (const bad of ["1.005", "-1", "1e3", "", " 1", "NaN", "999999999999"]) assert.throws(() => toCentavos(bad), PaymentQuoteError);
});
test("payment plan charges the server merchandise total and itemizes lines", () => {
 const plan = planPayment(quote());
 assert.deepEqual(plan.lines, [{ variantId: item().variantId, name: "Shirt · M", unitAmount: 25050, quantity: 2 }]);
 assert.equal(plan.total, 50100); assert.equal(plan.discount, 0);
});
test("coupon discount must reconcile with subtotal and total", () => {
 assert.equal(planPayment(quote({ couponCode: "SAVE", discountTotal: "50.10", merchandiseTotal: "450.90" })).discount, 5010);
 assert.throws(() => planPayment(quote({ discountTotal: "50.10", merchandiseTotal: "501.00" })), PaymentQuoteError);
 assert.throws(() => planPayment(quote({ discountTotal: "600", merchandiseTotal: "0" })), PaymentQuoteError);
});
test("inconsistent, unavailable or empty carts fail closed", () => {
 for (const bad of [
  quote({ subtotal: "500.00", merchandiseTotal: "500.00" }),
  quote({ cart: { id: quote().cart.id, items: [item({ lineTotal: "500.00" })], subtotal: "501.00" } }),
  quote({ cart: { id: quote().cart.id, items: [item({ available: false })], subtotal: "501.00" } }),
  quote({ cart: { id: quote().cart.id, items: [item({ quantityValid: false })], subtotal: "501.00" } }),
  quote({ cart: { id: quote().cart.id, items: [item({ unitPrice: null })], subtotal: "501.00" } }),
  quote({ cart: { id: null, items: [], subtotal: "0" } }),
 ]) assert.throws(() => planPayment(bad), PaymentQuoteError);
});
test("totals below the PayMongo PHP 1.00 minimum are refused", () => {
 assert.equal(MINIMUM_CHARGE, 100);
 assert.throws(() => planPayment(quote({ couponCode: "FREE", discountTotal: "500.01", merchandiseTotal: "0.99" })), /minimum/);
 assert.equal(planPayment(quote({ couponCode: "BIG", discountTotal: "500.00", merchandiseTotal: "1.00" })).total, 100);
});
test("line items are itemized without a discount", () => {
 assert.deepEqual(checkoutLineItems(planPayment(quote())), [{ name: "Shirt · M", amount: 25050, quantity: 2, currency: "PHP" }]);
});
test("a discount becomes one exact line, never a negative or rounded line", () => {
 const items = checkoutLineItems(planPayment(quote({ couponCode: "SAVE", discountTotal: "50.10", merchandiseTotal: "450.90" })));
 assert.equal(items.length, 1); assert.equal(items[0].amount, 45090); assert.equal(items[0].quantity, 1);
 assert.match(items[0].description, /Shirt · M × 2\. Coupon SAVE applied: −PHP 50\.10 from PHP 501\.00\./);
 const many = { id: quote().cart.id, items: Array.from({ length: 20 }, (_, i) => item({ variantId: `33333333-3333-4333-8333-${String(i).padStart(12, "0")}`, productName: "Very long product name ".repeat(3) })), subtotal: "10020.00" };
 const long = checkoutLineItems(planPayment(quote({ cart: many, subtotal: "10020.00", couponCode: "X", discountTotal: "20.00", merchandiseTotal: "10000.00" })));
 assert.ok(long[0].description.length <= 255); assert.equal(long[0].amount, 1000000);
});
test("the amount shown on the Pay button must equal the re-quoted total", () => {
 assert.equal(planPayment(quote(), "501.00").total, 50100);
 assert.equal(planPayment(quote(), "501").total, 50100);
 for (const shown of ["25.00", "501.01", "", "501.000", "abc", "-501"]) assert.throws(() => planPayment(quote(), shown), PaymentQuoteError);
});
