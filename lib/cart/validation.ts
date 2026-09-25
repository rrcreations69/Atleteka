import { z } from "zod";

export const guestTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const cartQuantitySchema = z.string().regex(/^[1-9]\d*$/).transform(Number)
  .pipe(z.number().int().min(1).max(2147483647));
export const cartMutationSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("add"), variantId: z.uuid(), quantity: cartQuantitySchema }),
  z.object({ operation: z.literal("set"), variantId: z.uuid(), quantity: cartQuantitySchema }),
  z.object({ operation: z.literal("remove"), variantId: z.uuid(), quantity: z.null() }),
]);
const amountSchema = z.string().regex(/^\d+(?:\.\d+)?$/).max(1000);
export const cartSchema = z.object({
  id: z.uuid().nullable(),
  items: z.array(z.object({
    variantId: z.uuid(),
    productSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i).nullable(),
    productName: z.string().min(1),
    variantName: z.string().min(1),
    quantity: z.number().int().min(1).max(2147483647),
    unitPrice: amountSchema.nullable(),
    lineTotal: amountSchema.nullable(),
    available: z.boolean(),
    quantityValid: z.boolean(),
  })),
  subtotal: amountSchema,
});
export type Cart = z.infer<typeof cartSchema>;
export type CartState = { error?: string; message?: string };

export function parseCartForm(form: FormData) {
  // Duplicate fields are ambiguous. Browser-supplied prices/owners are ignored.
  const fields = ["operation", "variantId", "quantity"] as const;
  if (fields.some((key) => form.getAll(key).length > 1)) return null;
  const result = cartMutationSchema.safeParse({
    operation: form.get("operation"), variantId: form.get("variantId"), quantity: form.get("quantity"),
  });
  return result.success ? result.data : null;
}
