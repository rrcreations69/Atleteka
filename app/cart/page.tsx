import Link from "next/link";
import { Container } from "@/components/layout/container";
import { QuantityStepper, RemoveItemButton } from "@/components/cart/cart-line-controls";
import { ProductImage } from "@/components/catalog/product-image";
import { getCart, CartAccessError } from "@/lib/cart/data";
import { getProductThumbnails } from "@/lib/catalog/data";
import { formatPrice } from "@/lib/catalog/validation";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cart" };

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
  const count = cart.items.reduce((total, item) => total + item.quantity, 0);
  const blocked = cart.items.some((item) => !item.quantityValid);
  const thumbnails = await getProductThumbnails(cart.items.flatMap((item) => item.productSlug ? [item.productSlug] : [])).catch(() => new Map());

  if (cart.items.length === 0) return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl">Cart</h1>
      <div className="mt-8 flex flex-col items-center gap-5 bg-card px-6 py-16 text-center">
        <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
        <div className="space-y-1.5">
          <p className="text-lg font-semibold">Your cart is empty</p>
          <p className="text-muted-foreground">Items you add will appear here.</p>
        </div>
        <Link href="/shop" className={buttonVariants()}>Browse products</Link>
      </div>
    </Container>
  );

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-5">
        <h1 className="text-3xl sm:text-4xl">Cart <span className="text-muted-foreground">({count} {count === 1 ? "item" : "items"})</span></h1>
        <Link href="/shop" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Continue shopping</Link>
      </div>

      <div className="mt-2 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
        <ul aria-label="Cart items">
          {cart.items.map((item) => {
            const label = item.productName + " · " + item.variantName;
            const image = item.productSlug ? thumbnails.get(item.productSlug) : undefined;
            const name = item.productSlug
              ? <Link href={"/products/" + item.productSlug} className="underline-offset-4 hover:underline">{item.productName}</Link>
              : item.productName;
            return <li key={item.variantId} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 border-b border-border py-6 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6">
              <ProductImage image={image} shape="portrait" sizes="112px" className={item.available ? undefined : "opacity-60"} />
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <h2 className="break-words text-base font-semibold tracking-normal">{name}</h2>
                    <p className="break-words text-sm text-muted-foreground">{item.variantName}</p>
                    <p className="text-sm text-muted-foreground">{item.unitPrice === null ? "Price unavailable" : formatPrice(item.unitPrice) + " each"}</p>
                  </div>
                  <p className="shrink-0 text-right font-semibold tabular-nums">
                    <span className="sr-only">Line total: </span>{item.lineTotal === null ? "Unavailable" : formatPrice(item.lineTotal)}
                  </p>
                </div>
                {!item.quantityValid && <p role="status" className="border-l-2 border-destructive pl-3 text-sm text-destructive">{item.available
                  ? "Not enough stock for this quantity. Lower it or remove this item."
                  : "This option is unavailable. Remove it or check again later."}</p>}
                <div className="mt-auto flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <QuantityStepper key={item.variantId + ":" + item.quantity} variantId={item.variantId} quantity={item.quantity} productLabel={label} disabled={!item.available} />
                  <RemoveItemButton variantId={item.variantId} productLabel={label} />
                </div>
              </div>
            </li>;
          })}
        </ul>

        <aside aria-labelledby="order-summary" className="lg:pt-6">
          <div className="space-y-5 bg-card p-5 sm:p-6 lg:sticky lg:top-8">
            <h2 id="order-summary" className="text-lg">Order summary</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Items</dt><dd className="tabular-nums">{count}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Shipping</dt><dd className="text-right">Paid to the courier on delivery</dd></div>
              <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4 text-base font-semibold"><dt>Subtotal</dt><dd className="text-xl tabular-nums">{formatPrice(cart.subtotal)}</dd></div>
            </dl>
            <p className="text-xs text-muted-foreground">Prices include tax. Unavailable items are excluded.</p>
            {blocked && <p role="status" className="text-sm text-destructive">Fix the items marked above before checking out.</p>}
            <Link href="/checkout" className={buttonVariants({ className: "w-full" })}>Checkout</Link>
            <div className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <p>Prices and availability are checked when your cart loads or changes. Items are not reserved.</p>
              <p>{kind === "guest"
                ? "Guest cart, saved in this browser for 30 days. Signing in opens your separate account cart."
                : "Account cart. Your guest cart stays separate in this browser."}</p>
              <a href="/cart" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-foreground">Refresh prices and availability</a>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
