import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CartAccessError, createCartClient } from "@/lib/cart/data";
import { getSavedAddresses } from "@/lib/checkout/data";
import { quoteError, quoteSchema } from "@/lib/checkout/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout | Atleteka" };

async function loadCheckout() {
  try {
    const { client, kind } = await createCartClient();
    const { data, error } = await client.rpc("checkout_quote", { coupon_code: null });
    if (error) {
      if (!["P7001", "P7002", "P7004"].includes(error.code)) throw new Error("Unable to load checkout.");
      return { error: quoteError(error.code), identityError: false } as const;
    }
    const quote = quoteSchema.parse(data);
    const addresses = kind === "account" ? await getSavedAddresses(client) : [];
    return { quote, addresses, account: kind === "account" } as const;
  } catch (error) {
    if (!(error instanceof CartAccessError)) throw error;
    return { error: error.message, identityError: true } as const;
  }
}
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const cancelled = (await searchParams).payment === "cancelled";
  const result = await loadCheckout();
  if ("error" in result) return <Container className="space-y-5 py-12">
    <h1 className="text-3xl font-semibold">Checkout</h1>
    <p role="status">{result.error}</p>
    {result.identityError && <p><Link href="/login" className="underline underline-offset-4">Sign in</Link></p>}
    <Link href="/cart" className="underline underline-offset-4">Return to cart</Link>
    <p><a href="/checkout" className="underline underline-offset-4">Refresh checkout</a></p>
    <p><Link href="/shop" className="underline underline-offset-4">Browse products</Link></p>
  </Container>;
  return <Container className="space-y-8 py-10 sm:py-16">
    <h1 className="text-3xl font-semibold">Checkout</h1>
    <Link href="/cart" className="inline-flex min-h-11 items-center underline underline-offset-4">Return to cart</Link>
    {cancelled && <p role="status" className="rounded-md border border-border p-4">Payment cancelled. You have not been charged, and your cart is unchanged.</p>}
    <CheckoutForm initialQuote={result.quote} addresses={result.addresses} account={result.account} />
  </Container>;
}
