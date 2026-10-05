import test from "node:test";
import assert from "node:assert/strict";
const { buildOrderConfirmation, orderNumber } = await import("../lib/email/order-confirmation.ts");

const order = (patch = {}) => ({
 id: "30faefc1-66bd-4f23-a396-4d636eedffce", createdAt: "2026-09-28T06:43:00Z", accountOrder: true,
 subtotal: "50.00", discountTotal: "5.00", grandTotal: "45.00",
 address: { name: "Juan <script>alert(1)</script>", line1: "1 Rizal St", line2: "", city: "Makati", region: "Metro Manila", postal_code: "1200" },
 items: [{ productName: "Shirt & Co", variantName: "Small", sku: "M02-SHIRT-S", quantity: 2, unitPrice: "25.00", lineTotal: "50.00" }],
 ...patch,
});

test("confirmation content: number, items, totals, shipping note, address, link", () => {
 const email = buildOrderConfirmation(order(), "https://shop.example", "Atleteka");
 assert.equal(orderNumber(order().id), "30FAEFC1");
 assert.equal(email.subject, "Your Atleteka order 30FAEFC1");
 for (const part of ["Shirt & Co · Small × 2", "PHP", "Discount: −", "Amount paid:", "you pay the courier directly on delivery", "Makati, Metro Manila 1200", "https://shop.example/order/30faefc1-66bd-4f23-a396-4d636eedffce"]) {
  assert.ok(email.text.includes(part), part);
 }
});
test("customer-entered text is escaped in the HTML", () => {
 const { html } = buildOrderConfirmation(order(), "https://shop.example", "Atleteka");
 assert.ok(!html.includes("<script>"));
 assert.ok(html.includes("Juan &lt;script&gt;alert(1)&lt;/script&gt;"));
 assert.ok(html.includes("Shirt &amp; Co"));
});
test("guest orders get no account link and no discount line when there is none", () => {
 const email = buildOrderConfirmation(order({ accountOrder: false, discountTotal: "0", grandTotal: "50.00" }), "https://shop.example", "Atleteka");
 assert.ok(!email.text.includes("/order/"));
 assert.ok(!email.text.includes("Discount"));
});

test("M16-P01: permanent Resend refusals stop retries; transient failures stay retryable", async () => {
 const { isPermanentEmailRefusal } = await import("../lib/email/retry.ts");
 for (const status of [400, 401, 403, 404, 422]) assert.equal(isPermanentEmailRefusal(status), true, String(status));
 for (const status of [undefined, 408, 409, 429, 500, 502, 503]) assert.equal(isPermanentEmailRefusal(status), false, String(status));
});
test("the subject names the store from the brand settings", () => {
 assert.equal(buildOrderConfirmation(order(), "https://shop.example", "Acme Apparel").subject, "Your Acme Apparel order 30FAEFC1");
});
