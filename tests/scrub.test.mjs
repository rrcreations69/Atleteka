import test from "node:test";
import assert from "node:assert/strict";
const { scrubEvent, scrubText } = await import("../lib/monitoring/scrub.ts");

test("emails and key-like secrets are masked in text", () => {
 const out = scrubText("user juan.dela+cruz@gmail.com key sk_test_abc123DEF re_AbCdEfGh12345 whsk_Zz99 sb_secret_x-Y_z eyJhbGciOi.eyJzdWIiOi.c2lnbmF0dXJl cs_ddf351587fc95c3d451144b9 pkce_157343cc4b815d7e0b");
 for (const leak of ["juan.dela", "gmail.com", "sk_test_", "re_AbCd", "whsk_", "sb_secret_", "eyJhbGciOi", "cs_ddf35", "pkce_1573"]) assert.ok(!out.includes(leak), leak);
 assert.match(out, /\[email\].*\[paymongo-key\].*\[resend-key\].*\[webhook-secret\].*\[supabase-key\].*\[jwt\].*\[provider-id\].*\[provider-id\]/);
});
test("events lose request details and user fields; messages, exceptions, breadcrumbs are scrubbed", () => {
 const event = scrubEvent({
  message: "failed for a@b.co",
  user: { email: "a@b.co", ip_address: "1.2.3.4" },
  request: { url: "https://shop.example/checkout?email=a@b.co", cookies: { sb: "x" }, headers: { authorization: "Bearer t" }, data: "name=Juan", query_string: "email=a@b.co" },
  exception: { values: [{ value: "Resend rejected re_SECRETKEY123 for a@b.co" }] },
  breadcrumbs: [{ message: "fetch pay_1234567890abcdef", data: { url: "https://api.x/?key=sk_live_ZZZZ", nested: { to: "x@y.com" } } }],
  extra: { customer: "x@y.com" },
 });
 assert.equal(event.user, undefined);
 assert.deepEqual(Object.keys(event.request), ["url"]);
 assert.equal(event.request.url, "https://shop.example/checkout");
 const all = JSON.stringify(event);
 for (const leak of ["a@b.co", "x@y.com", "re_SECRET", "sk_live_", "pay_1234", "Bearer", "Juan", "1.2.3.4"]) assert.ok(!all.includes(leak), leak);
});
