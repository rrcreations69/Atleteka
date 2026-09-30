import test from "node:test";
import assert from "node:assert/strict";
const { MAX_IMAGE_BYTES, detectImage, priceSchema, productInputSchema, stockInputSchema, variantInputSchema } = await import("../lib/admin/validation.ts");

const pad = (head) => { const b = new Uint8Array(32); b.set(head); return b; };
const ascii = (s) => [...s].map((c) => c.charCodeAt(0));

test("images are identified by content, not by name or declared type", () => {
 assert.equal(detectImage(pad([0xff, 0xd8, 0xff, 0xe0])).mime, "image/jpeg");
 assert.equal(detectImage(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])).ext, "png");
 assert.equal(detectImage(pad([...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")])).mime, "image/webp");
 for (const bad of [pad(ascii("GIF89a")), pad(ascii("<svg xmlns")), pad(ascii("%PDF-1.7")), pad([0x4d, 0x5a]), new Uint8Array(4)]) assert.equal(detectImage(bad), null);
 assert.equal(MAX_IMAGE_BYTES, 4 * 1024 * 1024);
});
test("prices are exact PHP amounts", () => {
 for (const ok of ["0", "25", "499.5", "499.50"]) assert.equal(priceSchema.safeParse(ok).success, true);
 for (const bad of ["-1", "1.005", "1e3", "abc", "", "1,000"]) assert.equal(priceSchema.safeParse(bad).success, false);
});
test("slugs and SKUs are normalized and validated", () => {
 assert.equal(productInputSchema.parse({ name: "Shirt", slug: " Training-Shirt ", description: "", status: "active" }).slug, "training-shirt");
 assert.equal(productInputSchema.safeParse({ name: "Shirt", slug: "bad slug!", description: "", status: "active" }).success, false);
 assert.equal(productInputSchema.safeParse({ name: "Shirt", slug: "ok", description: "", status: "deleted" }).success, false);
 assert.equal(variantInputSchema.parse({ title: "M", sku: "shirt-m", price: "25", active: true }).sku, "SHIRT-M");
 assert.equal(variantInputSchema.safeParse({ title: "M", sku: "shirt m", price: "25", active: true }).success, false);
});
test("stock must be a whole, non-negative number", () => {
 const id = "11111111-1111-4111-8111-111111111111";
 assert.equal(stockInputSchema.parse({ variantId: id, expected: "3", quantity: "10" }).quantity, 10);
 for (const q of ["-1", "2.5", "abc", "1000001"]) assert.equal(stockInputSchema.safeParse({ variantId: id, expected: "3", quantity: q }).success, false);
});
