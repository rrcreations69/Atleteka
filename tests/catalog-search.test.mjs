import test from "node:test";
import assert from "node:assert/strict";
import { catalogQuerySchema, catalogHref, literalSearchPattern } from "../lib/catalog/validation.ts";

test("search defaults and whitespace are predictable", () => {
  assert.deepEqual(catalogQuerySchema.parse({}), { q: "", category: "", availability: "all", page: 1 });
  assert.equal(catalogQuerySchema.parse({ q: "  Training Shirt  ", availability: "" }).q, "Training Shirt");
  assert.equal(catalogQuerySchema.parse({ q: "   " }).q, "");
  assert.equal(catalogQuerySchema.parse({ page: "2" }).page, 2);
});

test("URL boundary rejects duplicate, invalid and oversized values", () => {
  for (const input of [
    { q: ["shirt", "towel"] }, { category: ["training"] }, { availability: ["in-stock"] }, { page: ["2"] },
    { q: "x".repeat(101) }, { q: "one\u0000two" }, { category: "../admin" },
    { availability: "secret" }, { page: "0" }, { page: "-1" }, { page: "1.2" },
    { page: "" }, { page: "1e2" }, { page: "100001" }, { page: true },
  ]) assert.equal(catalogQuerySchema.safeParse(input).success, false, JSON.stringify(input));
  assert.equal(catalogQuerySchema.parse({ role: "admin", status: "inactive", price: "1" }).role, undefined);
});

test("search patterns treat metacharacters and punctuation as literal text", () => {
  for (const value of ["[shirt].*+$^?(){}|\\", "100%_cotton*", 'x"),status.eq.inactive', "O'Brien"]) {
    const regex = new RegExp(literalSearchPattern(value), "i");
    assert.equal(regex.test("prefix " + value + " suffix"), true);
    assert.equal(regex.test("unrelated training shirt"), false);
  }
  assert.equal(new RegExp(literalSearchPattern("SHIRT"), "i").test("Training shirt"), true);
});

test("pagination and category links preserve only validated state and safely encode text", () => {
  const input = catalogQuerySchema.parse({ q: "A&B + 100%", category: "training", availability: "in-stock", page: "2" });
  const url = new URL(catalogHref("/search", input), "https://example.test");
  assert.equal(url.pathname, "/search");
  assert.equal(url.searchParams.get("q"), "A&B + 100%");
  assert.equal(url.searchParams.get("category"), "training");
  assert.equal(url.searchParams.get("availability"), "in-stock");
  assert.equal(url.searchParams.get("page"), "2");
  const reset = new URL(catalogHref("/categories/other", { ...input, category: "", page: 1 }), url.origin);
  assert.equal(reset.searchParams.has("category"), false);
  assert.equal(reset.searchParams.has("page"), false);
  assert.equal(reset.searchParams.get("q"), input.q);
  assert.equal(catalogHref("/shop", catalogQuerySchema.parse({})), "/shop");
});
