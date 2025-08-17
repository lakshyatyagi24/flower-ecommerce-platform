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
};

const slides: Slide[] = [
  // 1) Combined overlay stacked at center-right (eyebrow, title, subtitle, CTA)
  {
    id: 0,
    img: slider1,
    alt: 'Birthday bouquet',
    bg: 'from-amber-50 to-amber-100',
    overlay: {
      combined: true,
      position: 'center-right',
  eyebrow: 'BRIGHTEN THEIR SPECIAL DAY',
  title: 'Birthday',
  subtitle: 'FLOWERS',
  cta: { label: 'Shop Birthday', href: '#' },
  /* inline color example */
  textColor: '#1f2937',
  button: { bg: '#065f46', text: '#ffffff' },
    },
  },

  // 2) Individual item positions (eyebrow top-center, title center-right, subtitle bottom-right, CTA bottom-right)
  {
    id: 1,
  img: slider2,
    alt: 'Handpicked bouquets',
    bg: 'from-pink-50 to-pink-100',
    overlay: {
    combined: true,
      position: 'center',
      eyebrow: 'HANDPICKED BOUQUETS',
      title: 'Fresh',
      subtitle: 'ARRIVALS',
      cta: { label: 'Explore Now', href: '#' },
      /* Tailwind class example */
      textClass: 'text-white',
      buttonClass: 'inline-block bg-white text-pink-600 px-5 py-2 rounded-md shadow hover:opacity-95',
    },
  },

  // 3) Image-only slide (no overlay)
  {
    id: 2,
    img: slider3,
    alt: 'Window arrangement',
    bg: 'from-green-50 to-green-100',
  },

  // 4) Gradient background only with combined overlay at bottom-left
  {
    id: 3,
  img: slider4,
    alt: 'Autumn specials',
    bg: 'from-indigo-50 to-indigo-100',
    overlay: {
      combined: true,
      position: 'bottom-right',
      eyebrow: 'LIMITED TIME',
      title: 'Autumn Specials',
      subtitle: 'Curated arrangements',
      cta: { label: 'See Offers', href: '#' },
    },
  },

  // 5) Slide with only CTA (no title) positioned at bottom-center
  {
    id: 4,
  img: slider5,
    alt: 'Track order CTA',
    bg: 'from-yellow-50 to-yellow-100',
    overlay: {
      position: 'center',
      cta: { label: 'Track Order', href: '#' },
      itemPosition: { cta: 'bottom-center' },
    },
  },

  // 6) Title-only slide centered
  {
    id: 5,
  img: slider6,
    alt: 'New collections',
    bg: 'from-teal-50 to-teal-100',
    overlay: {
      position: 'center',
      title: 'New Collections',
    },
  },

  // 7) Mixed per-item positions demonstrating flexible layout
  {
    id: 6,
  img: slider7,
    alt: 'Personalised gifts',
    bg: 'from-rose-50 to-rose-100',
    overlay: {
      position: 'center-right',
      eyebrow: 'DISCOVER',
      title: 'Personalised Gifts',
      subtitle: 'Built with care',
      cta: { label: 'Customize', href: '#' },
      itemPosition: { eyebrow: 'top-left', title: 'top-center', subtitle: 'center-left', cta: 'bottom-center' },
    },
  },

  // 8) Image-only / decorative slide (different gradient)
  {
    id: 7,
  img: slider8,
    alt: 'Decorative',
    bg: 'from-lime-50 to-lime-100',
  },
];

export default function Slider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const autoplayRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    autoplayRef.current = window.setInterval(() => {
      setIndex((s) => (s + 1) % slides.length);
    }, 4000);
    return () => {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
    };
  }, [paused]);

  function go(i: number) {
    setIndex((i + slides.length) % slides.length);
  }

  return (
    <section
      className="w-full max-w-6xl mx-auto rounded-2xl overflow-hidden bg-transparent"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="relative h-56 sm:h-72 md:h-96 lg:h-80 xl:h-96">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(.2,.9,.2,1)] transform will-change-transform ${
              i === index ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 -translate-x-4 z-0 pointer-events-none'
            }`}
            aria-hidden={i === index ? 'false' : 'true'}
          >
            {/* background image (full-bleed) */}
            <div className={`absolute inset-0 bg-gradient-to-r ${s.bg || ''} bg-opacity-75`} />
            {s.img && (
              <div className="absolute inset-0">
                <Image
                  src={s.img}
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
                {/* helper to map position -> classes for absolute placement */}
                {/**
                 * position tokens: top-left, top-center, top-right,
                 * center-left, center, center-right,
                 * bottom-left, bottom-center, bottom-right
                 */}
                {
                  /** render each overlay item absolutely based on itemPosition or overlay.position */
                }
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
                              {s.overlay.cta.href ? (
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
                        return s.overlay!.cta!.href ? (
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
          {slides.map((_, i) => (
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
