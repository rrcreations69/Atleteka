import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <Container className="flex flex-wrap items-center justify-between gap-4 py-6">
        <p className="text-sm text-muted-foreground">Atleteka</p>
        <a href="#top" className={buttonVariants({ variant: "outline" })}>
          Back to top
        </a>
      </Container>
    </footer>
  );
}
