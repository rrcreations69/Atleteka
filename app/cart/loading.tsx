import { Container } from "@/components/layout/container";

export default function CartLoading() {
  return <Container className="space-y-5 py-12"><h1 className="text-3xl font-semibold">Your cart</h1><p role="status">Loading your cart...</p></Container>;
}
