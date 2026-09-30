import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
const { parseEvent, paymentMetadataSchema, verifySignature, SIGNATURE_TOLERANCE_SECONDS } = await import("../lib/payment/webhook.ts");

const secret = "whsk_test_secret";
const body = JSON.stringify({ data: { id: "evt_1", attributes: { type: "checkout_session.payment.paid", livemode: false, data: { id: "cs_abc123" } } } });
const sign = (t, raw = body, key = secret) => createHmac("sha256", key).update(`${t}.${raw}`).digest("hex");
const now = 1_790_000_000;

test("valid test-mode signature over the raw body is accepted", () => {
 assert.equal(verifySignature(`t=${now},te=${sign(now)},li=`, body, secret, false, now), true);
});
test("tampered body, wrong secret, wrong mode, stale or malformed headers are rejected", () => {
 const header = `t=${now},te=${sign(now)},li=`;
 assert.equal(verifySignature(header, body.replace("evt_1", "evt_2"), secret, false, now), false);
 assert.equal(verifySignature(`t=${now},te=${sign(now, body, "other")},li=`, body, secret, false, now), false);
 assert.equal(verifySignature(header, body, secret, true, now), false);
 assert.equal(verifySignature(header, body, secret, false, now + SIGNATURE_TOLERANCE_SECONDS + 1), false);
 for (const bad of [null, "", "t=abc,te=00", `te=${sign(now)}`, `t=${now},te=zz,li=`]) assert.equal(verifySignature(bad, body, secret, false, now), false);
 assert.equal(verifySignature(header, body, "", false, now), false);
});
test("live-mode events verify against li", () => {
 assert.equal(verifySignature(`t=${now},te=,li=${sign(now)}`, body, secret, true, now), true);
});
test("event routing extracts id, type, mode and checkout session", () => {
 assert.deepEqual(parseEvent(body), { id: "evt_1", type: "checkout_session.payment.paid", livemode: false, sessionId: "cs_abc123" });
 assert.equal(parseEvent("not json"), null);
 assert.equal(parseEvent(JSON.stringify({ data: { id: "evt_1" } })), null);
});
const meta = {
 cart_id: "22222222-2222-4222-8222-222222222222", user_id: "", coupon_code: "SAVE",
 lines: "11111111-1111-4111-8111-111111111111:2:2500;33333333-3333-4333-8333-333333333333:1:1000",
 subtotal_centavos: "6000", discount_centavos: "600", total_centavos: "5400",
 shipping_address: JSON.stringify({ name: "T", line1: "1 St", line2: "", city: "Makati", region: "MM", postal_code: "1200", country: "PH" }),
};
test("session metadata parses into exact lines, totals and address", () => {
 const parsed = paymentMetadataSchema.parse(meta);
 assert.deepEqual(parsed.lines[0], { variantId: "11111111-1111-4111-8111-111111111111", quantity: 2, unitCentavos: 2500 });
 assert.equal(parsed.total_centavos, 5400); assert.equal(parsed.shipping_address.city, "Makati");
});
test("malformed or foreign metadata is refused", () => {
 for (const patch of [{ lines: "nope" }, { lines: "11111111-1111-4111-8111-111111111111:0:2500" }, { total_centavos: "54.00" },
  { cart_id: "x" }, { shipping_address: "{}" }, { shipping_address: JSON.stringify({ ...JSON.parse(meta.shipping_address), country: "US" }) }]) {
  assert.equal(paymentMetadataSchema.safeParse({ ...meta, ...patch }).success, false);
 }
 assert.equal(paymentMetadataSchema.safeParse({}).success, false);
});
