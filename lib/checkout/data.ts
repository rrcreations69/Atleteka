import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { addressSchema, savedAddressSchema, type Address } from "./validation";

export async function accountId(client: SupabaseClient) {
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Account could not be verified.");
  return user.id;
}
export async function getSavedAddresses(client: SupabaseClient) {
  const id = await accountId(client);
  const { data, error } = await client.from("addresses")
    .select("id,name,line1,line2,city,region,postal_code,country").eq("user_id", id).order("id");
  if (error) throw new Error("Saved addresses could not be loaded.");
  // Old account addresses may have no line2; only PH checkout-compatible rows are offered.
  return z.array(z.unknown()).parse(data).flatMap((row) => {
    const normalized = z.object({ line2: z.string().nullable() }).passthrough().safeParse(row);
    if (!normalized.success) return [];
    const address = savedAddressSchema.safeParse({ ...normalized.data, line2: normalized.data.line2 ?? "" });
    return address.success ? [address.data] : [];
  });
}
export async function saveAddress(client: SupabaseClient, input: Address) {
  const address = addressSchema.parse(input);
  const id = await accountId(client);
  const existing = await getSavedAddresses(client);
  if (existing.some((row) => Object.entries(address).every(([key, value]) => row[key as keyof Address] === value))) return;
  const { error } = await client.from("addresses").insert({ ...address, user_id: id });
  if (error) throw new Error("Address could not be saved.");
}
