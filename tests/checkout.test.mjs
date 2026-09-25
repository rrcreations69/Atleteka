import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
registerHooks({ resolve(specifier, context, next) {
  if (specifier === "../cart/validation" && context.parentURL?.endsWith("/lib/checkout/validation.ts")) return next("../cart/validation.ts", context);
  return next(specifier, context);
}});
const { addressSchema, parseCheckoutForm, quoteSchema, quoteError } = await import("../lib/checkout/validation.ts");
const address = { name: "Shopper", line1: "123 Test Street", line2: "", city: "Manila", region: "Metro Manila", postal_code: "1000", country: "PH" };
function form() { const f = new FormData(); for (const [key, value] of Object.entries(address)) f.set(key, value); f.set("couponCode", " SAVE "); return f; }
test("checkout accepts a trimmed Philippine address and one code", () => {
 const parsed = parseCheckoutForm(form());
 assert.equal(parsed.success, true); assert.equal(parsed.data.couponCode, "SAVE");
 assert.equal(addressSchema.parse({ ...address, name: " Shopper " }).name, "Shopper");
});
test("checkout rejects unsupported country, malformed postcode and missing/oversized address", () => {
 for (const patch of [{ country: "US" }, { postal_code: "123" }, { postal_code: "12345" }, { postal_code: "1e03" }, { name: " " }, { line1: "x".repeat(201) }]) {
  assert.equal(addressSchema.safeParse({ ...address, ...patch }).success, false);
 }
});
test("checkout ignores forged totals, identity and selected-address IDs", () => {
 const f=form();for(const key of ["user_id","addressId","subtotal","discountTotal","shippingTotal","grandTotal","redemption_count"])f.set(key,"forged");
 assert.deepEqual(parseCheckoutForm(f).data, { ...address, couponCode:"SAVE" });
});
test("duplicate and non-text form values fail validation", () => {
 for (const key of ["name","country","couponCode"]) { const f=form();f.append(key,"other");assert.equal(parseCheckoutForm(f).success,false); }
 const f=form();f.set("name",new Blob(["unexpected"]),"name.txt");assert.equal(parseCheckoutForm(f).success,false);
});
test("quote boundary requires exact decimal strings and pending shipping/final total", () => {
 const quote={cart:{id:null,items:[],subtotal:"20.50"},currency:"PHP",couponCode:null,subtotal:"20.50",discountTotal:"0",merchandiseTotal:"20.50",taxIncluded:true,shippingTotal:null,grandTotal:null};
 assert.equal(quoteSchema.safeParse(quote).success,true);
 for (const patch of [{ shippingTotal:"0" },{ grandTotal:"20.50" },{ currency:"USD" },{ taxIncluded:false },{ subtotal:20.50 },{ merchandiseTotal:"NaN" }])assert.equal(quoteSchema.safeParse({...quote,...patch}).success,false);
});
test("database error mapping does not expose arbitrary database messages", () => {
 assert.match(quoteError("P7002"),/Update your cart/);
 assert.match(quoteError("P7003"),/usage limit/);
 assert.equal(quoteError("secret detail"),"We could not calculate your total. Please try again.");
});
