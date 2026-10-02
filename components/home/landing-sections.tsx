import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";

// Static home page sections. Copy states only what the store actually does (D-DESIGN-04).

export type ShopLink = { href: string; label: string };

export function BrandStatement() {
  return (
    <section aria-labelledby="brand-heading" className="bg-navy text-background [--ring:var(--apricot)]">
      <Container className="grid gap-8 py-16 sm:py-24 lg:grid-cols-[3fr_2fr] lg:items-end">
        <div>
          <p className="eyebrow text-xs text-apricot">Atleteka</p>
          <h2 id="brand-heading" className="mt-4 max-w-2xl text-display">Everyday pieces, made to last.</h2>
        </div>
        <div className="space-y-6">
          <p className="max-w-md text-lg leading-relaxed text-[#cfd3de]">Wardrobe staples for women and men: easy shirts, honest trousers and layers you&apos;ll reach for every day. Simple to shop, delivered anywhere in the Philippines.</p>
          <Link href="/shop" className={buttonVariants()}>Shop the collection</Link>
        </div>
      </Container>
    </section>
  );
}

const icon = { "aria-hidden": true, width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const;

const REASONS: { title: string; body: string; glyph: ReactNode }[] = [
  { title: "Everyday essentials", body: "Wardrobe staples for women and men, designed for daily wear.",
    glyph: <svg {...icon}><path d="M8 4l-4 3 2 4 2-1v10h8V10l2 1 2-4-4-3c-.5 1.5-2 2.5-4 2.5S8.5 5.5 8 4z" /></svg> },
  { title: "Live stock by size", body: "See what's available in your size before you add it to your cart.",
    glyph: <svg {...icon}><path d="M4 7h16M4 12h16M4 17h10" /><circle cx="18" cy="17" r="2" /></svg> },
  { title: "Pay your way", body: "Card, QR Ph and e-wallets, secured by PayMongo.",
    glyph: <svg {...icon}><rect x="3" y="6" width="18" height="12" /><path d="M3 10h18M7 15h4" /></svg> },
  { title: "Delivered nationwide", body: "Anywhere in the Philippines. Shipping is paid to the courier on delivery.",
    glyph: <svg {...icon}><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.5" /><circle cx="17" cy="17.5" r="1.5" /></svg> },
];

export function WhyAtleteka() {
  return (
    <section aria-labelledby="why-heading">
      <Container className="mt-16 sm:mt-24">
        <p className="eyebrow text-xs text-primary">Why Atleteka</p>
        <h2 id="why-heading" className="mt-2 text-2xl sm:text-3xl">Good clothes, simply sold.</h2>
        <ul className="mt-8 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((reason) => <li key={reason.title} className="bg-background p-6">
            <span className="text-primary">{reason.glyph}</span>
            <h3 className="mt-4 text-base font-semibold">{reason.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{reason.body}</p>
          </li>)}
        </ul>
      </Container>
    </section>
  );
}

const STEPS = [
  { title: "Choose your size", body: "Pick a piece and your size. Stock is shown for every option." },
  { title: "Pay securely", body: "Check out as a guest and pay by card, QR Ph or e-wallet through PayMongo. Prices include tax." },
  { title: "Get it delivered", body: "We deliver anywhere in the Philippines. You pay the courier for shipping when your order arrives." },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="mt-16 bg-card sm:mt-24">
      <Container className="py-14 sm:py-20">
        <p className="eyebrow text-xs text-primary">How it works</p>
        <h2 id="how-heading" className="mt-2 text-2xl sm:text-3xl">From cart to doorstep in three steps.</h2>
        <ol className="mt-10 grid gap-10 sm:grid-cols-3">
          {STEPS.map((step, index) => <li key={step.title} className="border-t-2 border-foreground pt-5">
            <span className="eyebrow text-xs text-muted-foreground">Step {index + 1}</span>
            <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </li>)}
        </ol>
      </Container>
    </section>
  );
}

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

export function ClosingCta({ links }: { links: ShopLink[] }) {
  return (
    <section aria-labelledby="closing-heading" className="mt-16 bg-foreground text-background [--ring:var(--apricot)] sm:mt-24">
      <Container className="flex flex-col items-start gap-8 py-16 sm:flex-row sm:items-end sm:justify-between sm:py-20">
        <div>
          <p className="eyebrow text-xs text-apricot">Ready when you are</p>
          <h2 id="closing-heading" className="mt-3 max-w-xl text-3xl sm:text-4xl">Find your everyday pieces.</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {links.map((link, index) => <Link key={link.href} href={link.href} className={buttonVariants({ variant: index === 0 ? "default" : "inverse" })}>{link.label}</Link>)}
        </div>
      </Container>
    </section>
  );
}
