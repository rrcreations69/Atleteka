import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardDescription } from "@/components/ui/card";

export default function HomePage() {
  return (
    <Container className="flex flex-1 items-center py-12 sm:py-20">
      <Card className="w-full">
        <CardContent className="px-6 py-12 sm:px-12 sm:py-20">
          <p className="text-sm font-medium tracking-wide text-muted-foreground">Atleteka</p>
          <h1 className="mt-4 max-w-3xl text-display font-semibold">
            Welcome to Atleteka.
          </h1>
          <CardDescription className="mt-6 max-w-prose">
            Browse our collection.
          </CardDescription>
          <Link href="/shop" className="mt-6 inline-flex min-h-11 items-center underline underline-offset-4">Explore the shop</Link>
        </CardContent>
      </Card>
    </Container>
  );
}
