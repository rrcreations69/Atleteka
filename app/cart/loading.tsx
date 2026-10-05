import { Container } from "@/components/layout/container";

export default function CartLoading() {
  return <Container className="py-8 sm:py-12">
    <h1 className="border-b border-border pb-5 text-3xl sm:text-4xl">Cart</h1>
    <p role="status" className="sr-only">Loading your cart...</p>
    <div aria-hidden="true" className="mt-2 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
      <div>{[0, 1].map((row) => <div key={row} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 border-b border-border py-6 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6">
        <div className="aspect-[4/5] bg-photo motion-safe:animate-pulse" />
        <div className="space-y-3"><div className="h-4 w-1/2 bg-card motion-safe:animate-pulse" /><div className="h-4 w-1/4 bg-card motion-safe:animate-pulse" /></div>
      </div>)}</div>
      <div className="h-64 bg-card motion-safe:animate-pulse lg:mt-6" />
    </div>
  </Container>;
}
