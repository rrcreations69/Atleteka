import Link from "next/link";
import { Container } from "@/components/layout/container";

export default function OrderNotFound() {
  return <Container className="space-y-5 py-12">
    <h1 className="text-3xl font-semibold">Order not found</h1>
    <p role="status">We could not find this order in your account.</p>
    <p><Link href="/account/orders" className="underline underline-offset-4">View your orders</Link></p>
  </Container>;
}
