"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { brand } from "@/lib/brand";
import { moodVars } from "@/lib/home-moods";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  id: string; slug: string; name: string; blurb: string; price: string;
  image: { url: string; alt: string };
};

const INTERVAL = 6000;
const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

// Each featured product takes over the hero in a brand mood, with the store name oversized behind it.
// It advances every 6 s only while it is on screen and not paused; reduced motion starts it paused.
export function ColorHero({ slides }: { slides: HeroSlide[] }) {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);
  // Until the visitor presses Pause or Play, reduced motion decides.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? reduced;
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.intersectionRatio > 0.5), { threshold: [0, 0.5, 1] });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The page around the hero takes the active mood.
  useEffect(() => {
    const canvas = section.current?.closest<HTMLElement>("[data-home-canvas]");
    if (!canvas) return;
    for (const [key, value] of Object.entries(moodVars(brand.heroMoods[active % brand.heroMoods.length]))) canvas.style.setProperty(key, String(value));
  }, [active]);

  useEffect(() => {
    if (paused || !inView || slides.length < 2) return;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % slides.length), INTERVAL);
    return () => window.clearTimeout(timer);
  }, [active, paused, inView, slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[active];
  const running = !paused && inView;

  return (
    <section ref={section} aria-roledescription="carousel" aria-label="Featured pieces"
      className="relative isolate overflow-hidden bg-[var(--home-field)] text-[var(--home-text)] [--ring:var(--home-text)] motion-safe:transition-colors motion-safe:duration-700"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") setActive((active + 1) % slides.length);
        if (event.key === "ArrowLeft") setActive((active - 1 + slides.length) % slides.length);
      }}>
      <div className="relative mx-auto h-[min(86svh,46rem)] min-h-[38rem] max-w-[90rem]">
        <span aria-hidden="true" className="font-display pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 select-none whitespace-nowrap text-center text-[clamp(6.5rem,23vw,22rem)] font-medium uppercase leading-none tracking-[-0.02em] text-[var(--home-word)] motion-safe:transition-colors motion-safe:duration-700 sm:top-1/2">
          {brand.name}
        </span>
        {slides.map((item, index) => <div key={item.id} aria-hidden={index !== active}
          className={cn("absolute inset-x-0 bottom-[42%] top-[5%] flex justify-center sm:bottom-[20%] sm:top-[6%] motion-safe:transition-[opacity,transform] motion-safe:duration-700",
            index === active ? "opacity-100" : "translate-y-4 scale-[0.97] opacity-0")}>
          <div className="relative h-full w-[min(90%,34rem)]">
            <Image src={item.image.url} alt={item.image.alt} fill priority={index === 0} sizes="(min-width: 640px) 34rem, 90vw"
              className="object-contain drop-shadow-[0_28px_30px_rgba(0,0,0,0.28)]" />
          </div>
        </div>)}

        <div aria-live="polite" className="absolute bottom-24 left-5 right-5 max-w-md sm:bottom-11 sm:left-12">
          <h2 className="font-display text-[1.75rem] font-semibold leading-tight sm:text-4xl">{slide.name}</h2>
          {slide.blurb && <p className="mt-2 leading-relaxed opacity-85">{slide.blurb}</p>}
          <p className="mt-1 font-semibold">{slide.price}</p>
          <Link href={`/products/${slide.slug}`}
            className="mt-4 inline-flex min-h-12 items-center rounded-full bg-[var(--home-text)] px-7 text-sm font-semibold text-[var(--home-field)] motion-safe:transition-colors motion-safe:duration-700">
            Shop now
          </Link>
        </div>

        {slides.length > 1 && <div className="absolute bottom-7 left-5 flex items-center gap-2.5 sm:bottom-12 sm:left-auto sm:right-12">
          {slides.map((item, index) => <button key={item.id} type="button" onClick={() => setActive(index)}
            aria-label={`Show ${item.name}`} aria-current={index === active ? "true" : undefined}
            className="relative h-11 w-10 sm:w-14">
            <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-[var(--home-text)] opacity-25" />
            {/* A new key restarts the bar whenever the timer restarts, so the two agree. */}
            <span key={index === active ? `${active}-${running}` : index}
              className={cn("absolute left-0 top-1/2 h-[3px] -translate-y-1/2 bg-[var(--home-text)]",
                index < active ? "w-full" : "w-0",
                index === active && "motion-safe:animate-[hero-fill_6s_linear_forwards]",
                index === active && !running && "[animation-play-state:paused]")} />
          </button>)}
          <button type="button" onClick={() => setUserPaused(!paused)} aria-label={paused ? "Play the carousel" : "Pause the carousel"}
            className="ml-1 inline-flex h-9 items-center rounded-full border border-current px-4 text-sm font-semibold">
            {paused ? "Play" : "Pause"}
          </button>
        </div>}
      </div>
    </section>
  );
}
