"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, sanitizeImageUrl } from "@/lib/api";

type Slide = {
  id: string | number;
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
};

const staticSlides: Slide[] = [
  {
    id: "fallback-1",
    image:
      "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5577.jpg?v=1709440942",
    alt: "Jumilla roses from The Flora",
    eyebrow: "Farm fresh, delivered fast",
    title: "Fresh flowers for every occasion",
    subtitle:
      "Premium cut flowers sourced directly from farms and hand-delivered across major Indian cities.",
    ctaLabel: "Shop Flowers",
    href: "/products?category=cut-flowers",
  },
  {
    id: "fallback-2",
    image:
      "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5528.jpg?v=1709440820",
    alt: "Heliconia stems",
    eyebrow: "Events and celebrations",
    title: "Beautiful blooms for big moments",
    subtitle:
      "Wedding decor, birthdays, corporate gifting and elegant bouquets crafted with real seasonal stems.",
    ctaLabel: "Explore Collection",
    href: "/products",
  },
  {
    id: "fallback-3",
    image:
      "https://cdn.shopify.com/s/files/1/0047/4637/9362/products/WES_3378.jpg?v=1621319809",
    alt: "Dendrobium orchids",
    eyebrow: "Theflora catalog",
    title: "Curated from real marketplace inventory",
    subtitle:
      "Roses, orchids, lilies, carnations and more with fresh photos synced from live catalog data.",
    ctaLabel: "See New Arrivals",
    href: "/products?category=cut-flowers",
  },
];

function mapRemoteSlide(raw: any, index: number): Slide | null {
  const image = sanitizeImageUrl(raw?.image);
  if (!image) return null;

  const overlay = raw?.config?.overlay ?? {};
  const cta = overlay?.cta ?? {};

  return {
    id: raw?.id ?? `remote-${index}`,
    image,
    alt: raw?.alt ?? overlay?.title ?? raw?.title ?? `Fresh Petals slide ${index + 1}`,
    eyebrow: overlay?.eyebrow ?? raw?.eyebrow ?? "Fresh Petals India",
    title: overlay?.title ?? raw?.title ?? "Fresh flowers for every occasion",
    subtitle:
      overlay?.subtitle ??
      raw?.subtitle ??
      "Premium fresh-cut flowers delivered with care.",
    ctaLabel: cta?.label ?? "Shop Now",
    href: cta?.href ?? raw?.href ?? "/products",
  };
}

export default function Slider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [remoteSlides, setRemoteSlides] = useState<Slide[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .listSliders()
      .then((data) => {
        if (cancelled) return;
        const mapped = data
          .map((row, i) => mapRemoteSlide(row, i))
          .filter((row): row is Slide => !!row);
        setRemoteSlides(mapped);
      })
      .catch(() => {
        if (!cancelled) setRemoteSlides([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const slides = useMemo(
    () => (remoteSlides && remoteSlides.length > 0 ? remoteSlides : staticSlides),
    [remoteSlides],
  );

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [paused, slides]);

  function go(i: number) {
    if (slides.length === 0) return;
    setIndex((i + slides.length) % slides.length);
  }

  return (
    <section
      className="w-full max-w-screen-xl mx-auto rounded-[28px] overflow-hidden bg-transparent shadow-[0_30px_70px_rgba(24,20,13,0.12)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="relative h-[420px] sm:h-[520px] md:h-[560px] lg:h-[520px] xl:h-[600px]">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(.2,.9,.2,1)] transform will-change-transform ${
              i === index
                ? "opacity-100 translate-x-0 z-10"
                : "opacity-0 -translate-x-4 z-0 pointer-events-none"
            }`}
            aria-hidden={i === index ? "false" : "true"}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1152px"
              priority={i === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/30 to-black/30" />

            <div className="relative h-full w-full p-6 sm:p-10 md:p-12 flex items-end">
              <div className="max-w-2xl text-white drop-shadow-sm">
                <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-white/90 font-semibold">
                  {slide.eyebrow}
                </p>
                <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
                  {slide.title}
                </h2>
                <p className="mt-3 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                  {slide.subtitle}
                </p>
                <div className="mt-5">
                  <Link
                    href={slide.href}
                    className="inline-flex items-center justify-center rounded-full bg-white text-[#394019] px-5 py-2.5 text-sm font-semibold shadow-md hover:bg-[#f4f7ea] transition"
                  >
                    {slide.ctaLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 text-slate-900 shadow hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 text-slate-900 shadow hover:bg-white"
            >
              ›
            </button>
          </>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((slide, i) => (
            <button
              key={`dot-${slide.id}`}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? "w-8 bg-white" : "w-2.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
