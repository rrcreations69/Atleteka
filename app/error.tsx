"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Container className="py-16">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="my-5 text-muted-foreground">We could not load this page. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </Container>
  );
}
