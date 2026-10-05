import { Container } from "@/components/layout/container";

// Home page FAQ. Copy states only what the store actually does (D-DESIGN-04).

const QUESTIONS = [
  { q: "How much is shipping?", a: "Shipping isn't part of your online payment. You pay the courier's fee directly when your order arrives." },
  { q: "Which payment methods do you accept?", a: "Card, QR Ph and e-wallets, all through PayMongo's secure checkout." },
  { q: "Do I need an account to order?", a: "No. You can check out as a guest. With an account you can see your orders and save delivery addresses." },
  { q: "Are prices tax-inclusive?", a: "Yes. Every price you see includes tax." },
  { q: "Where do you deliver?", a: "Anywhere in the Philippines." },
];

export function Faq() {
  return (
    <section aria-labelledby="faq-heading">
      <Container className="mt-16 grid gap-8 sm:mt-24 lg:grid-cols-[2fr_3fr]">
        <div>
          <p className="eyebrow text-xs text-primary">Questions</p>
          <h2 id="faq-heading" className="mt-2 text-2xl sm:text-3xl">Good to know.</h2>
        </div>
        <div className="border-t border-border">
          {QUESTIONS.map((item) => <details key={item.q} className="group border-b border-border">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
              {item.q}<span aria-hidden="true" className="text-xl leading-none text-muted-foreground group-open:rotate-45 motion-safe:transition-transform">+</span>
            </summary>
            <p className="pb-5 leading-relaxed text-muted-foreground">{item.a}</p>
          </details>)}
        </div>
      </Container>
    </section>
  );
}
