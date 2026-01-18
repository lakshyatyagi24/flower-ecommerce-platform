"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image, { StaticImageData } from 'next/image';
// import local assets (from src/assets)
import slider1 from '../assets/slider1.png';
import slider2 from '../assets/slider2.png';
import slider3 from '../assets/slider3.png';
import slider4 from '../assets/slider4.png';
import slider5 from '../assets/slider5.png';
import slider6 from '../assets/slider6.png';
import slider7 from '../assets/slider7.png';
import slider8 from '../assets/slider8.png';

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

// default static slides used as a safe fallback
const staticSlides: Slide[] = [
  {
    id: 0,
    img: slider1,
    alt: 'Rebecca Purple bouquet',
    bg: 'from-[#f8f1e8] via-[#f4e7dc] to-[#efe0d2]',
    overlay: {
      combined: true,
      position: 'center-left',
      eyebrow: 'Luxe limited drop',
      title: 'Rebecca Purple',
      subtitle: 'Hand-tied, velvet ribboned, crafted for luminous evenings.',
      cta: { label: 'View Collection', href: '/products' },
      textClass: 'text-[#1f1c19]',
      buttonClass: 'inline-block bg-[#4a3b2a] text-white px-6 py-2.5 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition'
    },
  },
  {
    id: 1,
    img: slider2,
    alt: 'Forever florals',
    bg: 'from-[#f3e9de] via-[#f8f2e9] to-[#efe0d2]',
    overlay: {
      combined: true,
      position: 'center-right',
      eyebrow: 'Forever collection',
      title: 'Preserved stems that linger',
      subtitle: 'Muse-worthy palettes, artisanal packaging, delivered same-day.',
      cta: { label: 'Shop Forever', href: '/products?collection=autumn-rustic' },
      textClass: 'text-[#2c261f]',
      buttonClass: 'inline-block bg-white text-[#4a3b2a] px-5 py-2 rounded-full shadow hover:bg-[#f5ede2] border border-[#4a3b2a]/10'
    },
  },
  {
    id: 2,
    img: slider3,
    alt: 'Signature hampers',
    bg: 'from-[#efe6db] via-[#f7f1e8] to-[#f4e7dc]',
    overlay: {
      combined: true,
      position: 'center',
      eyebrow: 'Gifting, refined',
      title: 'Curated hampers with soul',
      subtitle: 'Candles, keepsakes, artisanal chocolates with blooms.',
      cta: { label: 'Build a hamper', href: '/products' },
    },
  },
  {
    id: 3,
    img: slider4,
    alt: 'Atelier service',
    bg: 'from-[#f4ece2] via-[#f8f2e9] to-[#efe0d2]',
    overlay: {
      combined: true,
      position: 'bottom-right',
      eyebrow: 'Atelier concierge',
      title: 'Installations & soirées',
      subtitle: 'Bespoke floral storytelling for events across NCR & Mumbai.',
      cta: { label: 'Book a consult', href: '/contact' },
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
  }, []);

  useEffect(() => {
    if (paused) return;
    const slidesArr = remoteSlides ?? staticSlides;
    autoplayRef.current = window.setInterval(() => {
      setIndex((s) => (s + 1) % slidesArr.length);
    }, 4000);
    return () => {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
    };
  }, [paused, remoteSlides]);

  function go(i: number) {
    const slidesArr = remoteSlides ?? staticSlides;
    setIndex((i + slidesArr.length) % slidesArr.length);
  }

  const slides = remoteSlides ?? staticSlides;

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
            
            <div className={`absolute inset-0 bg-gradient-to-r ${s.bg || ''} bg-opacity-90`} />
            {s.img && (
              <div className="absolute inset-0">
                <Image
                  src={typeof s.img === 'string' && s.img.startsWith('/') ? s.img : s.img as any}
                  alt={s.alt ?? s.overlay?.title ?? `slide-${s.id}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1152px"
                  priority={i === 0}
                />
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
                    const eyebrowClass = s.overlay.textClass ?? 'text-sm font-medium text-gray-600 tracking-widest mb-2';
                    const titleClass = s.overlay.textClass ?? 'text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight';
                    const subtitleClass = s.overlay.textClass ?? 'mt-2 text-xl sm:text-2xl font-semibold text-slate-700';
                    const defaultBtnClass = 'inline-block bg-olive-green text-white px-5 py-2 rounded-md shadow hover:opacity-95';
                    const btnClass = s.overlay.buttonClass ?? defaultBtnClass;

                    return (
                      <div className={`${mapPos(s.overlay.position)} max-w-3xl`}>
                        <div className="flex flex-col items-start md:items-start lg:items-start text-left">
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
