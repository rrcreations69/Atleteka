import { z } from "zod";

const text = (max: number, label: string) => z.string().trim().min(1, `Enter ${label}.`).max(max, `Use ${max} characters or fewer.`);
const slug = z.string().trim().toLowerCase().min(1, "Enter a slug.").max(200, "Use 200 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.");

export const productInputSchema = z.object({
  name: text(200, "a name"),
  slug,
  description: z.string().trim().max(5000, "Use 5000 characters or fewer."),
  status: z.enum(["active", "inactive"], { error: "Choose a status." }),
});

// Exact PHP amounts: whole pesos with at most two centavo digits, kept as a string for numeric columns.
export const priceSchema = z.string().trim().regex(/^\d{1,9}(?:\.\d{1,2})?$/, "Enter a price like 499 or 499.50.");

export const variantInputSchema = z.object({
  title: text(120, "an option name"),
  sku: z.string().trim().toUpperCase().min(1, "Enter a SKU.").max(64, "Use 64 characters or fewer.")
    .regex(/^[A-Z0-9]+(?:[-_][A-Z0-9]+)*$/, "Use letters, numbers, hyphens or underscores."),
  price: priceSchema,
  active: z.boolean(),
});

export const categoryInputSchema = z.object({ name: text(120, "a name"), slug, active: z.boolean() });

export const stockInputSchema = z.object({
  variantId: z.uuid(),
  expected: z.coerce.number<string>().int().min(0),
  quantity: z.coerce.number<string>({ error: "Enter a whole number." }).int("Enter a whole number.")
    .min(0, "Stock cannot be negative.").max(1_000_000, "Use 1,000,000 or less."),
});

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const signatures = [
  { mime: "image/jpeg", ext: "jpg", test: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: "png", test: (b: Uint8Array) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v) },
  { mime: "image/webp", ext: "webp", test: (b: Uint8Array) =>
    String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP" },
] as const;

/** Identifies an image by its bytes; the browser-supplied name and type are never trusted. */
export function detectImage(bytes: Uint8Array) {
  return signatures.find((signature) => bytes.length >= 12 && signature.test(bytes)) ?? null;
}

export const altTextSchema = text(200, "a short image description");

/** Reads one form value; duplicates are ambiguous and rejected. */
export function single(form: FormData, key: string) {
  const values = form.getAll(key);
  return values.length === 1 && typeof values[0] === "string" ? values[0] : null;
}

export function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) errors[String(issue.path[0])] ??= issue.message;
  return errors;
}
