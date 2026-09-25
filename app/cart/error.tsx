"use client";

import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function CartError() {
  return <Container className="space-y-5 py-12">
    <h1 className="text-2xl font-semibold">We could not load your cart</h1>
    <p role="alert">Please try again in a moment.</p>
    <div className="flex flex-wrap items-center gap-5">
      <Button onClick={() => window.location.reload()}>Try again</Button>
      <Link href="/shop" className="underline underline-offset-4">Back to shop</Link>
    </div>
  </Container>;
}
