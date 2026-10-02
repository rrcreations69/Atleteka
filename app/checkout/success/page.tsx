import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Payment submitted | Atleteka" };

// Reaching this page is not proof of payment; only the verified PayMongo webhook (M09) finalizes an order.
export default function CheckoutSuccessPage() {
  return <Container className="max-w-2xl space-y-5 py-12 sm:py-20">
    <p className="eyebrow text-xs text-muted-foreground">Payment submitted</p>
    <h1 className="text-3xl sm:text-4xl">Thank you for your order.</h1>
    <p role="status">Thank you. We are confirming your payment with PayMongo. Your order is final only after this confirmation.</p>
    <p className="text-sm text-muted-foreground">Shipping is not included in this payment. You pay the courier directly on delivery.</p>
    <p><Link href="/shop" className={buttonVariants()}>Continue shopping</Link></p>
  </Container>;
}
