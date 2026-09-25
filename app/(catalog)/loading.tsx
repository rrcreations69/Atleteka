import { Container } from "@/components/layout/container";

export default function CatalogLoading() {
  return (
    <Container className="py-10 sm:py-16">
      <p role="status" className="mb-6 text-muted-foreground">Loading catalog...</p>
      <div aria-hidden="true" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="aspect-square rounded-xl bg-muted motion-safe:animate-pulse" />)}
      </div>
    </Container>
  );
}
