import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";

export function AuthCard({ title, description, children }: {
  title: string; description: string; children: ReactNode;
}) {
  return (
    <Container className="py-12 sm:py-20">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </Container>
  );
}
