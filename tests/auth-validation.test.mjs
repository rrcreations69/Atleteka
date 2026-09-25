import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema, passwordSchema, recoverySchema, profileSchema, callbackCodeSchema, validationError } from "../lib/auth/validation.ts";

test("credentials validate email, preserve passwords and discard injected authoritative fields", () => {
  const value = loginSchema.parse({ email: "  user@example.com  ", password: "  password  ", role: "admin", userId: "other" });
  assert.deepEqual(value, { email: "user@example.com", password: "  password  " });
  for (const input of [{ email: "bad", password: "x" }, { email: "a@b.com", password: "" }, { email: "a@b.com", password: "x".repeat(1025) }]) {
    assert.equal(loginSchema.safeParse(input).success, false);
  }
});
test("registration accepts only a bounded name and credentials", () => {
  assert.equal(registerSchema.safeParse({ email: "a@b.com", password: "pw", displayName: " " }).success, false);
  assert.equal(registerSchema.safeParse({ email: "a@b.com", password: "pw", displayName: "a".repeat(81) }).success, false);
  const input = registerSchema.parse({ email: "a@b.com", password: "pw", displayName: " Name ", role: "admin" });
  assert.equal(input.displayName, "Name");
  assert.equal("role" in input, false);
});
test("password confirmation validates on the server", () => {
  const bad = passwordSchema.safeParse({ password: "new", confirmPassword: "different" });
  assert.equal(bad.success, false);
  assert.equal(validationError(bad.error).fields.confirmPassword, "Passwords must match.");
  assert.equal(passwordSchema.safeParse({ password: "new", confirmPassword: "new" }).success, true);
});
test("recovery rejects malformed and missing email", () => {
  assert.equal(recoverySchema.safeParse({}).success, false);
  assert.equal(recoverySchema.safeParse({ email: "https://example.com" }).success, false);
});
test("authoritative profile must contain a valid identity and known role", () => {
  const p = { id: "550e8400-e29b-41d4-a716-446655440000", display_name: "Name", role: "customer" };
  assert.equal(profileSchema.safeParse(p).success, true);
  assert.equal(profileSchema.safeParse({ ...p, role: "superuser" }).success, false);
  assert.equal(profileSchema.safeParse({ ...p, id: "other" }).success, false);
  assert.equal(profileSchema.safeParse(null).success, false);
});
test("callback code cannot contain a URL or control characters", () => {
  assert.equal(callbackCodeSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success, true);
  for (const value of [null, "", "https://evil.example", "abc\n", "a".repeat(2049)]) {
    assert.equal(callbackCodeSchema.safeParse(value).success, false);
  }
});
