import Link from "next/link";
import { Container } from "@/components/layout/container";

export const metadata = { title: "Payment submitted | Atleteka" };

// Reaching this page is not proof of payment; only the verified PayMongo webhook (M09) finalizes an order.
export default function CheckoutSuccessPage() {
  return <Container className="space-y-5 py-12">
    <h1 className="text-3xl font-semibold">Payment submitted</h1>
    <p role="status">Thank you. We are confirming your payment with PayMongo. Your order is final only after this confirmation.</p>
    <p className="text-sm text-muted-foreground">Shipping is not included in this payment. You pay the courier directly on delivery.</p>
    <p><Link href="/shop" className="underline underline-offset-4">Continue shopping</Link></p>
  </Container>;
}
