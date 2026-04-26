"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image, { StaticImageData } from 'next/image';

type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

type Slide = {
  id: number;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  alt?: string;
  img?: string | StaticImageData;
  bg?: string;
  /* overlay configuration: if omitted, no overlay/text will be shown */
  overlay?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    cta?: {
      label: string;
      href?: string;
    };
  /* optional color customization */
  textColor?: string; /* CSS color for eyebrow/title/subtitle */
  button?: { bg?: string; text?: string };
  /* optional Tailwind class overrides (preferred if provided) */
  textClass?: string; /* additional classNames to apply to eyebrow/title/subtitle */
  buttonClass?: string; /* full className for CTA button (replaces default button classes) */
    /* placement of overlay content within the slide (default for all items) */
    position?: Position;
    /* optional per-element positions overriding `position` */
    itemPosition?: Partial<Record<'eyebrow' | 'title' | 'subtitle' | 'cta', Position>>;
  /* if true, use a single position and stack all items vertically at that position */
  combined?: boolean;
  };
  /* routing configuration */
  routing?: {
    behavior?: 'complete-image-and-button' | 'button-only' | 'whole-image';
  };
};

// default static slides using real product images from theflora.in
const staticSlides: Slide[] = [
  {
    id: 0,
    img: 'https://cdn.shopify.com/s/files/1/0047/4637/9362/files/The_Flora_Banner.jpg?v=1727676100',
    alt: 'Fresh flowers delivered across India',
    overlay: {
      combined: true,
      position: 'center-left',
      eyebrow: 'Farm fresh, delivered fast',
      title: 'Flowers for Every Occasion',
      subtitle: 'Hand-tied bouquets sourced from the finest Indian farms. Same-day delivery across 8+ cities.',
      cta: { label: 'Shop Bouquets', href: '/products' },
      textClass: 'text-white drop-shadow-md',
      buttonClass: 'inline-block bg-white text-[#3d2c1e] px-6 py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition',
    },
  },
  {
    id: 1,
    img: 'https://cdn.shopify.com/s/files/1/0047/4637/9362/products/WES_8950.jpg?v=1619006766',
    alt: 'Sun Forest – Premium bouquet',
    overlay: {
      combined: true,
      position: 'center-right',
      eyebrow: 'New arrivals this week',
      title: "Nature's Finest Stems",
      subtitle: 'Seasonal blooms curated from trusted growers — roses, orchids, sunflowers and more.',
      cta: { label: 'See New Arrivals', href: '/products' },
      textClass: 'text-white drop-shadow-md',
      buttonClass: 'inline-block bg-[#4a3b2a] text-white px-6 py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition',
    },
  },
  {
    id: 2,
    img: 'https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_4670.jpg?v=1706891407',
    alt: 'Radiant Reverie – Blush bouquet',
    overlay: {
      combined: true,
      position: 'center-left',
      eyebrow: 'Gifting made beautiful',
      title: 'Bouquets She Will Love',
      subtitle: 'Lush arrangements in blush and cream — perfect for anniversaries and birthdays.',
      cta: { label: 'Shop Bouquets', href: '/products?category=bouquets' },
      textClass: 'text-white drop-shadow-md',
      buttonClass: 'inline-block bg-white text-[#7a2a3a] px-6 py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition',
    },
  },
  {
    id: 3,
    img: 'https://cdn.shopify.com/s/files/1/0047/4637/9362/products/TheFlora_AllTheColors_2.jpg?v=1665732723',
    alt: 'A Riot of Colours – Vibrant mixed bouquet',
    overlay: {
      combined: true,
      position: 'center-right',
      eyebrow: 'Events & celebrations',
      title: 'Florals for Every Event',
      subtitle: 'Weddings, birthdays, corporate setups — vibrant arrangements delivered pan-India.',
      cta: { label: 'Book an Event', href: '/contact' },
      textClass: 'text-white drop-shadow-md',
      buttonClass: 'inline-block bg-olive-green text-white px-6 py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition',
    },
  },
];

export default function Slider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [remoteSlides, setRemoteSlides] = useState<Slide[] | null>(null);
  const [loading, setLoading] = useState(false);
  const autoplayRef = useRef<number | null>(null);

  useEffect(() => {
    // fetch remote slides from backend
    const base = process.env.NEXT_PUBLIC_API_BASE;
    if (!base) return;
    setLoading(true);
    fetch(`${base}/sliders`)
      .then((r) => r.json())
      .then((data: any[]) => {
        // map backend slider shape to Slide[]
        const mapped: Slide[] = data.map((s: any, i: number) => {
          const cfg = s.config ?? {};
          console.log('Slider config:', JSON.stringify(cfg, null, 2));
          console.log('Slider routing:', cfg.routing);
          const overlayFromCfg = (() => {
            if (cfg.overlay) {
              const pos = (cfg.overlay.position ?? 'center') as Position;
              const cta = cfg.overlay.cta ?? (s.href ? { label: 'Shop', href: s.href } : undefined);
              return {
                combined: !!cfg.overlay.combined,
                position: pos,
                eyebrow: (cfg.overlay.eyebrow ?? s.eyebrow) as string | undefined,
                title: (cfg.overlay.title ?? s.title) as string | undefined,
                subtitle: (cfg.overlay.subtitle ?? s.subtitle) as string | undefined,
                cta: cta ? ({ label: String(cta.label), href: cta.href } as { label: string; href?: string }) : undefined,
                textColor: cfg.overlay.textColor as string | undefined,
                textClass: cfg.overlay.textClass as string | undefined,
                button: cfg.overlay.button as { bg?: string; text?: string } | undefined,
                buttonClass: cfg.overlay.buttonClass as string | undefined,
              };
            }

            if (s.title || s.eyebrow || s.subtitle) {
              return { combined: true, position: 'center' as Position, eyebrow: s.eyebrow, title: s.title, subtitle: s.subtitle, cta: s.href ? { label: 'Shop', href: s.href } : undefined };
            }

            return undefined;
          })();

          return {
            id: s.id ?? i,
            eyebrow: s.eyebrow ?? undefined,
            title: s.title ?? undefined,
            subtitle: s.subtitle ?? undefined,
            alt: s.alt ?? undefined,
            img: s.image ?? undefined,
            bg: cfg.bg ?? undefined,
            overlay: overlayFromCfg,
            routing: cfg.routing ? {
              behavior: (cfg.routing.behavior === 'whole-image' ? 'complete-image-and-button' : 
                       (cfg.routing.behavior === 'button-only' ? 'button-only' : 'complete-image-and-button')) as 'complete-image-and-button' | 'button-only'
            } : { behavior: 'complete-image-and-button' },
          };
        });
        setRemoteSlides(mapped);
      })
      .catch(() => setRemoteSlides(null))
      .finally(() => setLoading(false));
    // note: empty array [] is treated as "no data" → falls back to staticSlides
  }, []);

  useEffect(() => {
    if (paused) return;
    const slidesArr = (remoteSlides && remoteSlides.length > 0) ? remoteSlides : staticSlides;
    autoplayRef.current = window.setInterval(() => {
      setIndex((s) => (s + 1) % slidesArr.length);
    }, 4000);
    return () => {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
    };
  }, [paused, remoteSlides]);

  function go(i: number) {
    const slides2 = (remoteSlides && remoteSlides.length > 0) ? remoteSlides : staticSlides;
    setIndex((i + slides2.length) % slides2.length);
  }

  const slides = (remoteSlides && remoteSlides.length > 0) ? remoteSlides : staticSlides;

  return (
    <section
      className="w-full max-w-screen-xl mx-auto rounded-[28px] overflow-hidden bg-transparent shadow-[0_30px_70px_rgba(24,20,13,0.12)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="relative h-[420px] sm:h-[520px] md:h-[560px] lg:h-[520px] xl:h-[600px]">
  {slides.map((s: Slide, i: number) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(.2,.9,.2,1)] transform will-change-transform ${
              i === index ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 -translate-x-4 z-0 pointer-events-none'
            }`}
            aria-hidden={i === index ? 'false' : 'true'}
          >
            {/* Whole image link when routing behavior is 'complete-image-and-button' or legacy 'whole-image' */}
            {(s.routing?.behavior === 'complete-image-and-button' || s.routing?.behavior === 'whole-image') && s.overlay?.cta?.href && (
              <a
                href={s.overlay.cta.href}
                className="absolute inset-0 z-10"
                target="_blank"
                rel="noopener noreferrer"
              />
            )}
            
            <div className={`absolute inset-0 bg-gradient-to-r ${s.bg || 'from-black/10 to-black/10'}`} />
            {s.img && (
              <div className="absolute inset-0">
                <Image
                  src={s.img as any}
                  alt={s.alt ?? s.overlay?.title ?? `slide-${s.id}`}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px"
                  priority={i === 0}
                />
                {/* dark scrim for text legibility on real photos */}
                <div className="absolute inset-0 bg-black/30 pointer-events-none" />
              </div>
            )}

            {/* overlay container - optional; each item may have its own position */}
            {s.overlay && (
              <div className="relative h-full w-full">
                {(() => {
                  const mapPos = (pos?: Position) => {
                    const p = pos || s.overlay?.position || 'center-right';
                    switch (p) {
                      case 'top-left':
                        return 'absolute top-6 left-6 text-left';
                      case 'top-center':
                        return 'absolute top-6 left-1/2 -translate-x-1/2 text-center';
                      case 'top-right':
                        return 'absolute top-6 right-6 text-right';
                      case 'center-left':
                        return 'absolute top-1/2 -translate-y-1/2 left-6 text-left';
                      case 'center':
                        return 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center';
                      case 'center-right':
                        return 'absolute top-1/2 -translate-y-1/2 right-6 text-right';
                      case 'bottom-left':
                        return 'absolute bottom-6 left-6 text-left';
                      case 'bottom-center':
                        return 'absolute bottom-6 left-1/2 -translate-x-1/2 text-center';
                      case 'bottom-right':
                        return 'absolute bottom-6 right-6 text-right';
                      default:
                        return 'absolute top-1/2 -translate-y-1/2 right-6 text-right';
                    }
                  };

                  // if combined, render one stacked container at overlay.position
                  if (s.overlay?.combined) {
                    const textStyle = s.overlay.textColor ? { color: s.overlay.textColor } : undefined;
                    const btnStyle = s.overlay.button ? { backgroundColor: s.overlay.button.bg, color: s.overlay.button.text } : undefined;
                    const colorClass = s.overlay.textClass ?? 'text-slate-900';
                    const eyebrowClass = `text-xs font-semibold uppercase tracking-widest mb-2 ${colorClass}`;
                    const titleClass = `text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight ${colorClass}`;
                    const subtitleClass = `mt-2 text-sm sm:text-base font-medium max-w-sm ${colorClass} opacity-90`;
                    const defaultBtnClass = 'inline-block bg-olive-green text-white px-5 py-2 rounded-full shadow hover:opacity-95';
                    const btnClass = s.overlay.buttonClass ?? defaultBtnClass;

                    return (
                      <div className={`${mapPos(s.overlay.position)} max-w-sm sm:max-w-md px-6 sm:px-10`}>
                        <div className="flex flex-col items-start text-left">
                          {s.overlay.eyebrow && <p style={textStyle} className={eyebrowClass}>{s.overlay.eyebrow}</p>}
                          {s.overlay.title && <h3 style={textStyle} className={titleClass}>{s.overlay.title}</h3>}
                          {s.overlay.subtitle && <p style={textStyle} className={subtitleClass}>{s.overlay.subtitle}</p>}
                          {s.overlay.cta && (
                            <div className="mt-4">
                              {s.routing?.behavior === 'button-only' && s.overlay.cta.href ? (
                                <a href={s.overlay.cta.href} style={s.overlay.button ? btnStyle : undefined} className={btnClass}>{s.overlay.cta.label}</a>
                              ) : (
                                <button style={s.overlay.button ? btnStyle : undefined} className={btnClass}>{s.overlay.cta.label}</button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const Eyebrow = s.overlay?.eyebrow ? (
                    <div className={`${mapPos(s.overlay?.itemPosition?.eyebrow)} max-w-xs`}> 
                      <p style={s.overlay?.textColor ? { color: s.overlay!.textColor } : undefined} className={s.overlay?.textClass ?? 'text-sm font-medium text-gray-600 tracking-widest mb-2'}>{s.overlay!.eyebrow}</p>
                    </div>
                  ) : null;

                  const Title = s.overlay?.title ? (
                    <div className={`${mapPos(s.overlay?.itemPosition?.title)} max-w-2xl`}> 
                      <h3 style={s.overlay?.textColor ? { color: s.overlay!.textColor } : undefined} className={s.overlay?.textClass ?? 'text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight'}>{s.overlay!.title}</h3>
                    </div>
                  ) : null;

                  const Subtitle = s.overlay?.subtitle ? (
                    <div className={`${mapPos(s.overlay?.itemPosition?.subtitle)} max-w-xl`}> 
                      <p style={s.overlay?.textColor ? { color: s.overlay!.textColor } : undefined} className={s.overlay?.textClass ?? 'mt-2 text-xl sm:text-2xl font-semibold text-slate-700'}>{s.overlay!.subtitle}</p>
                    </div>
                  ) : null;

                  const Cta = s.overlay?.cta ? (
                    <div className={`${mapPos(s.overlay?.itemPosition?.cta)} max-w-xs`}> 
                      {(() => {
                        const btnStyle = s.overlay?.button ? { backgroundColor: s.overlay.button.bg, color: s.overlay.button.text } : undefined;
                        const defaultBtnClass = 'inline-block bg-olive-green text-white px-5 py-2 rounded-md shadow hover:opacity-95';
                        const btnClass = s.overlay?.buttonClass ?? defaultBtnClass;
                        return s.routing?.behavior === 'button-only' && s.overlay!.cta!.href ? (
                          <a href={s.overlay!.cta!.href} style={s.overlay?.button ? btnStyle : undefined} className={btnClass}>{s.overlay!.cta!.label}</a>
                        ) : (
                          <button style={s.overlay?.button ? btnStyle : undefined} className={btnClass}>{s.overlay!.cta!.label}</button>
                        );
                      })()}
                    </div>
                  ) : null;

                  return (
                    <>
                      {Eyebrow}
                      {Title}
                      {Subtitle}
                      {Cta}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        ))}

        {/* arrows */}
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full w-10 h-10 flex items-center justify-center z-20"
          onClick={() => go(index - 1)}
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full w-10 h-10 flex items-center justify-center z-20"
          onClick={() => go(index + 1)}
          aria-label="Next slide"
        >
          ›
        </button>

        {/* dots */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20 flex gap-3">
          {slides.map((_: Slide, i: number) => (
            <button
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i === index ? 'bg-slate-800 w-4 h-4' : 'bg-white/80'
              } shadow`}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
