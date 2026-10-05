import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CartAccessError, createCartClient } from "@/lib/cart/data";
import { getSavedAddresses } from "@/lib/checkout/data";
import { getProductThumbnails } from "@/lib/catalog/data";
import { quoteError, quoteSchema } from "@/lib/checkout/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

async function loadCheckout() {
  try {
    const { client, kind } = await createCartClient();
    const { data, error } = await client.rpc("checkout_quote", { coupon_code: null });
    if (error) {
      if (!["P7001", "P7002", "P7004"].includes(error.code)) throw new Error("Unable to load checkout.");
      return { error: quoteError(error.code), identityError: false } as const;
    }
    const quote = quoteSchema.parse(data);
    const [addresses, thumbnails] = await Promise.all([
      kind === "account" ? getSavedAddresses(client) : [],
      getProductThumbnails(quote.cart.items.flatMap((item) => item.productSlug ? [item.productSlug] : [])).catch(() => new Map()),
    ]);
    return { quote, addresses, account: kind === "account", thumbnails: Object.fromEntries(thumbnails) } as const;
  } catch (error) {
    if (!(error instanceof CartAccessError)) throw error;
    return { error: error.message, identityError: true } as const;
  }
}
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const cancelled = (await searchParams).payment === "cancelled";
  const result = await loadCheckout();
  if ("error" in result) return <Container className="space-y-5 py-12">
    <h1 className="text-3xl">Checkout</h1>
    <p role="status">{result.error}</p>
    {result.identityError && <p><Link href="/login" className="underline underline-offset-4">Sign in</Link></p>}
    <Link href="/cart" className="underline underline-offset-4">Return to cart</Link>
    <p><a href="/checkout" className="underline underline-offset-4">Refresh checkout</a></p>
    <p><Link href="/shop" className="underline underline-offset-4">Browse products</Link></p>
  </Container>;
  return <Container className="py-8 sm:py-12">
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-border pb-5">
      <div className="space-y-2">
        <Link href="/cart" className="eyebrow inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><span aria-hidden="true">←</span> Return to cart</Link>
        <h1 className="text-3xl sm:text-4xl">Checkout</h1>
      </div>
      <ol aria-label="Checkout steps" className="eyebrow flex items-center gap-2 pb-1 text-xs text-muted-foreground">
        <li><Link href="/cart" className="hover:text-foreground hover:underline hover:underline-offset-4">Cart</Link></li>
        <li aria-hidden="true">/</li>
        <li aria-current="step" className="font-semibold text-foreground">Delivery</li>
        <li aria-hidden="true">/</li>
        <li>Payment</li>
      </ol>
    </div>
    {cancelled && <p role="status" className="mt-6 border-l-2 border-foreground bg-card p-4 text-sm">Payment cancelled. You have not been charged, and your cart is unchanged.</p>}
    <div className="mt-8">
      <CheckoutForm initialQuote={result.quote} addresses={result.addresses} account={result.account} thumbnails={result.thumbnails} />
    </div>
  </Container>;
}
