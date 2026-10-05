import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Payment submitted" };

const steps = [
  ["We confirm your payment", "PayMongo tells us once your payment goes through. Your order is final only after this confirmation."],
  ["You get a confirmation email", "We email your order summary to the email address used for payment."],
  ["We ship your order", "You pay the courier's shipping fee directly on delivery."],
] as const;

// Reaching this page is not proof of payment; only the verified PayMongo webhook (M09) finalizes an order.
export default function CheckoutSuccessPage() {
  return <Container className="max-w-2xl py-12 sm:py-20">
    <div className="space-y-4 text-center">
      <svg aria-hidden="true" className="mx-auto text-success" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M7.5 12.5l3 3 6-6.5" />
      </svg>
      <p className="eyebrow text-xs text-muted-foreground">Payment submitted</p>
      <h1 className="text-3xl sm:text-4xl">Thank you for your order</h1>
      <p role="status" className="text-muted-foreground">We are confirming your payment with PayMongo.</p>
    </div>
    <section aria-labelledby="next-steps" className="mt-10 bg-card p-6 sm:p-8">
      <h2 id="next-steps" className="text-lg">What happens next</h2>
      <ol className="mt-5 space-y-5">
        {steps.map(([title, detail], index) => <li key={title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full border border-foreground text-sm font-semibold">{index + 1}</span>
          <div className="space-y-1 pt-1">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </div>
        </li>)}
      </ol>
    </section>
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Link href="/shop" className={buttonVariants()}>Continue shopping</Link>
      <Link href="/account/orders" className={buttonVariants({ variant: "outline" })}>View your orders</Link>
    </div>
    <p className="mt-4 text-center text-xs text-muted-foreground">Your orders page needs an account. Guest orders are confirmed by email.</p>
  </Container>;
}
