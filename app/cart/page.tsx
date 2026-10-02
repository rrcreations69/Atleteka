import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CartForm } from "@/components/cart/cart-form";
import { getCart, CartAccessError } from "@/lib/cart/data";
import { formatPrice } from "@/lib/catalog/validation";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cart | Atleteka" };

export default async function CartPage() {
  let result;
  try {
    result = await getCart();
  } catch (error) {
    if (!(error instanceof CartAccessError)) throw error;
    return <Container className="space-y-5 py-12">
      <h1 className="text-3xl">Cart</h1>
      <p role="alert">{error.message}</p>
      <Link href="/login" className="underline underline-offset-4">Sign in</Link>
      <p><a href="/cart" className="underline underline-offset-4">Refresh cart</a></p>
    </Container>;
  }
  const { cart, kind } = result;
  return (
    <Container className="max-w-3xl space-y-6 py-8 sm:py-12">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl">Cart</h1>
        <p className="text-sm text-muted-foreground">{kind === "guest"
          ? "Your guest cart is saved in this browser for 30 days. Signing in opens your separate account cart."
          : "This is your account cart. Your guest cart stays separate in this browser."}</p>
      </div>
      {cart.items.length === 0 ? <div className="space-y-5 bg-card p-10 text-center">
        <p className="text-lg">Your cart is empty.</p>
        <Link href="/shop" className={buttonVariants()}>Browse products</Link>
      </div> : <>
        <ul className="border-t border-border">
          {cart.items.map((item) => <li key={item.variantId} className="grid gap-5 border-b border-border py-6 sm:grid-cols-[1fr_auto]">
            <div className="min-w-0 space-y-2">
              <h2 className="break-words text-base font-semibold tracking-normal">{item.productSlug
                ? <Link href={"/products/" + item.productSlug} className="underline-offset-4 hover:underline">{item.productName}</Link>
                : item.productName}</h2>
              <p className="break-words text-muted-foreground">{item.variantName}</p>
              <p>Unit price: {item.unitPrice === null ? "Unavailable" : formatPrice(item.unitPrice)}</p>
              <p>Quantity: {item.quantity}</p>
              <p className="font-medium">Line total: {item.lineTotal === null ? "Unavailable" : formatPrice(item.lineTotal)}</p>
              {!item.quantityValid && <p role="status" className="text-sm text-destructive">{item.available
                ? "The saved quantity exceeds current stock. Reduce the quantity or remove this item."
                : "This option is unavailable. Remove it or check again later."}</p>}
            </div>
            <div className="space-y-4">
              <CartForm key={item.variantId + ":" + item.quantity} variantId={item.variantId} quantity={item.quantity} operation="set" disabled={!item.available} />
              <CartForm variantId={item.variantId} operation="remove" />
            </div>
          </li>)}
        </ul>
        <section aria-labelledby="cart-subtotal" className="space-y-3 bg-card p-5 sm:p-6">
          <h2 id="cart-subtotal" className="flex items-baseline justify-between gap-4 text-xl"><span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span></h2>
          <p className="text-sm text-muted-foreground">Shipping is paid to the courier on delivery. Prices include tax.</p>
          <p className="text-sm text-muted-foreground">Prices and availability are checked when your cart loads or changes. Items are not reserved. Unavailable product prices are excluded.</p>
          <a href="/cart" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Refresh prices and availability</a>
        </section>
        <div className="flex flex-col gap-3 sm:flex-row"><Link href="/checkout" className={buttonVariants({ className: "sm:flex-1" })}>Continue to checkout</Link><Link href="/shop" className={buttonVariants({ variant: "outline" })}>Continue shopping</Link></div>
      </>}
    </Container>
  );
}
