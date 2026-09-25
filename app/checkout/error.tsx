"use client";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
export default function CheckoutError() {
  return <Container className="space-y-5 py-12"><h1 className="text-3xl font-semibold">Checkout unavailable</h1>
    <p role="alert">We could not load checkout. Please try again.</p>
    <Button onClick={() => window.location.reload()}>Try again</Button>
    <p><a href="/cart" className="underline underline-offset-4">Return to cart</a></p>
  </Container>;
}
