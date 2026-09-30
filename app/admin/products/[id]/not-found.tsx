import Link from "next/link";
import { Container } from "@/components/layout/container";

export default function AdminProductNotFound() {
  return <Container className="space-y-5 py-12">
    <h1 className="text-3xl font-semibold">Product not found</h1>
    <p><Link href="/admin/products" className="underline underline-offset-4">All products</Link></p>
  </Container>;
}
