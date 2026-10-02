"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  id: string; slug: string; name: string; blurb: string; price: string;
  sizes: { title: string; inStock: boolean }[];
  image: { url: string; alt: string };
};

// Slide grounds rotate through the brand palette; apricot carries the price on every ground.
const GROUNDS = ["#181a2f", "#b4182d", "#242e49", "#54162b", "#37415c"];

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

// Scroll-snap carousel: swipe or scroll natively; the arrows and the next-piece thumbnail move one slide.
export function FeaturedHero({ slides }: { slides: HeroSlide[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // The active slide follows the scroll position, so swipes, trackpads and the buttons all agree.
  useEffect(() => {
    const root = track.current;
    if (!root) return;
    const sync = () => {
      if (root.clientWidth === 0) return;
      setActive(Math.min(slides.length - 1, Math.max(0, Math.round(root.scrollLeft / root.clientWidth))));
    };
    sync();
    root.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => { root.removeEventListener("scroll", sync); window.removeEventListener("resize", sync); };
  }, [slides.length]);

  const go = useCallback((index: number) => {
    const root = track.current;
    if (!root) return;
    const target = (index + slides.length) % slides.length;
    root.scrollTo({ left: target * root.clientWidth, behavior: scrollBehavior() });
  }, [slides.length]);

  if (slides.length === 0) return null;
  const next = slides[(active + 1) % slides.length];

  return (
    <section aria-roledescription="carousel" aria-label="Featured pieces" className="relative text-white [--ring:var(--apricot)]">
      <div ref={track} className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((slide, index) => <article key={slide.id} data-index={index} role="group" aria-roledescription="slide"
          aria-label={`${index + 1} of ${slides.length}: ${slide.name}`} aria-hidden={index !== active}
          className="relative w-full shrink-0 snap-start overflow-hidden" style={{ backgroundColor: GROUNDS[index % GROUNDS.length] }}>
          {/* The name, oversized and faint, sits behind the garment like a shop-window decal. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center text-[clamp(5rem,17vw,15rem)] font-bold leading-none tracking-[-0.04em] text-white/[0.07]">
            {slide.name}
          </span>
          <div className="relative mx-auto grid min-h-[38rem] max-w-6xl gap-6 px-5 pb-28 pt-16 sm:px-8 lg:min-h-[40rem] lg:grid-cols-[1fr_1.15fr_0.8fr] lg:items-center lg:gap-10 lg:px-12 lg:pb-24 lg:pt-16">
            <div className="relative order-2 lg:order-1">
              <h2 className="text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.03em]">{slide.name}</h2>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-white/80">{slide.blurb}</p>
              <Link href={`/products/${slide.slug}`} tabIndex={index === active ? 0 : -1} className={buttonVariants({ variant: "inverse", className: "mt-7" })}>Shop now</Link>
            </div>
            <div className="relative order-1 mx-auto aspect-[4/5] w-full max-w-[19rem] sm:max-w-sm lg:order-2 lg:max-w-none">
              <span aria-hidden="true" className="absolute inset-[8%] rounded-full bg-white/[0.09]" />
              <Image src={slide.image.url} alt={slide.image.alt} fill unoptimized priority={index === 0}
                sizes="(min-width: 1024px) 40vw, 80vw" className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.35)]" />
            </div>
            <div className="relative order-3 flex flex-wrap items-end justify-between gap-6 lg:flex-col lg:items-start lg:justify-center">
              <p className="text-3xl font-semibold text-apricot lg:text-4xl">{slide.price}</p>
              {slide.sizes.length > 0 && <div>
                <p className="mb-2 text-sm text-white/75">Sizes</p>
                <ul className="flex flex-wrap gap-2">
                  {slide.sizes.map((size) => <li key={size.title} className={cn("inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold",
                    size.inStock ? "bg-white/15" : "text-white/55 line-through")}>
                    {size.title}<span className="sr-only">{size.inStock ? "" : " (sold out)"}</span>
                  </li>)}
                </ul>
              </div>}
            </div>
          </div>
        </article>)}
      </div>

      {slides.length > 1 && <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-5 pb-6 sm:px-8 lg:px-12">
          <div className="pointer-events-auto flex items-center gap-3">
            <button type="button" onClick={() => go(active - 1)} aria-label="Previous piece" className="inline-flex size-11 items-center justify-center rounded-full border border-white/40 hover:bg-white/10">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button type="button" onClick={() => go(active + 1)} aria-label="Next piece" className="inline-flex size-11 items-center justify-center rounded-full border border-white/40 hover:bg-white/10">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5l7 7-7 7" /></svg>
            </button>
            <p aria-live="polite" className="ml-1 text-sm tabular-nums text-white/80">{active + 1} of {slides.length}</p>
          </div>
          <button type="button" onClick={() => go(active + 1)} className="pointer-events-auto hidden items-center gap-3 rounded-sm bg-white/10 p-2 pr-4 text-left hover:bg-white/15 sm:flex">
            <span className="relative block size-14 shrink-0"><Image src={next.image.url} alt="" fill unoptimized sizes="56px" className="object-contain" /></span>
            <span className="text-sm"><span className="block text-white/70">Next</span><span className="block font-semibold">{next.name}</span></span>
          </button>
        </div>
      </div>}
    </section>
  );
}
