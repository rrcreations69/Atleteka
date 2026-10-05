"use server";

import { revalidatePath } from "next/cache";
import { CartAccessError, createCartClient, getCart } from "./data";
import { cartSchema, parseCartForm, type CartState } from "./validation";

export async function changeCart(_state: CartState, form: FormData): Promise<CartState> {
  const input = parseCartForm(form);
  if (!input) return { error: "Choose a valid option and a whole quantity greater than zero. Use Remove to delete an item." };
  try {
    const { client } = await createCartClient();
    const { data, error } = await client.rpc("mutate_cart", {
      operation: input.operation, variant_id: input.variantId,
      quantity: input.operation === "remove" ? null : input.quantity,
    });
    if (error) {
      if (error.code === "22023") {
        return { error: "This option or quantity is no longer available. Refresh your cart and choose a smaller quantity or remove the item." };
      }
      return { error: "We could not update your cart. Please refresh it before trying again." };
    }
    cartSchema.parse(data);
  } catch (error) {
    return { error: error instanceof CartAccessError ? error.message : "We could not update your cart. Please refresh it before trying again." };
  }
  revalidatePath("/cart");
  return { message: input.operation === "add" ? "Added to cart." : input.operation === "remove" ? "Item removed." : "Quantity updated." };
}

// Item count for the header badge. Read-only (never creates a cart or sets a cookie); any failure
// shows no badge rather than breaking the header. Called from the client so pages stay cacheable.
export async function getCartCount(): Promise<number> {
  try {
    const { cart } = await getCart();
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  } catch {
    return 0;
  }
}
