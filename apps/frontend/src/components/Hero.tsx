'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { mockHeroSlides } from '../modules/hero/mockHeroSlides';

interface HeroProps {
  overlayStrength?: 'soft' | 'medium' | 'strong';
}

export default function Hero({ overlayStrength = 'medium' }: HeroProps) {
  const overlayGradients = {
    soft: 'linear-gradient(to top, rgba(44,36,24,0.4), rgba(44,36,24,0.2) 45%, transparent)',
    medium: 'linear-gradient(to top, rgba(44,36,24,0.78), rgba(44,36,24,0.42) 45%, rgba(44,36,24,0.18) 70%, transparent)',
    strong: 'linear-gradient(to top, rgba(44,36,24,0.9), rgba(44,36,24,0.6) 50%, transparent)',
  };

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <section className="relative max-w-4xl mx-auto py-8 px-2 sm:py-10 sm:px-4">
      <div
        className="rounded-xl overflow-hidden relative mb-8 min-h-[220px] sm:min-h-[320px] border transition-all duration-200"
        style={{
          boxShadow: 'var(--shadow-olive)',
          border: '1px solid var(--olive)',
          transition: 'box-shadow 0.2s, border-color 0.2s',
        }}
      >
        <Swiper
          spaceBetween={0}
          slidesPerView={1}
          loop={!prefersReducedMotion}
          autoplay={prefersReducedMotion ? undefined : { delay: 5000 }}
          keyboard={{ enabled: true }}
          role="region"
          aria-label="Hero Carousel"
          className="w-full h-[220px] sm:h-80"
        >
          {mockHeroSlides.map((slide, i) => (
            <SwiperSlide key={i} tabIndex={0} role="group">
              <div className="relative w-full h-[220px] sm:h-80">
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  {...(i === 0 ? { priority: true } : { loading: 'lazy', placeholder: 'blur' })}
                  className="object-cover brightness-90 saturate-150 w-full h-full"
                  style={{ minHeight: 220, minWidth: '100%', objectPosition: 'center top' }}
                  sizes="(max-width: 640px) 100vw, 640px"
                  aria-label={slide.alt}
                />
                <div
                  className="absolute inset-0 z-1"
                  style={{ background: overlayGradients[overlayStrength] }}
                  data-overlay={overlayStrength}
                />
                <div className="absolute inset-0 flex flex-col justify-center items-center z-10 text-center p-4 sm:p-6 md:p-8">
                  <div className="bg-[rgba(44,36,24,0.88)] rounded-xl py-3 md:py-4 px-4 md:px-6 shadow-lg">
                    <h1 className="font-serif font-bold text-white mb-2" style={{ fontSize: 'clamp(28px, 5.2vw, 56px)', textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                      Petal & Twine
                    </h1>
                  </div>
                  <div className="bg-[rgba(44,36,24,0.72)] rounded-lg mt-2 py-2 md:py-2.5 px-4 md:px-4 shadow-md">
                    <p className="text-beige font-medium" style={{ fontSize: 'clamp(16px, 3.4vw, 28px)', textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                      {slide.tagline}
                    </p>
                  </div>
                  <div className="bg-[rgba(44,36,24,0.6)] rounded-lg mt-2 py-2 px-3 md:px-3.5 shadow-sm">
                    <span className="text-base md:text-lg text-beige mb-2 block font-serif italic" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                      Lovingly crafted florals, delivered fresh
                    </span>
                  </div>
                </div>
                  <div
                    className="flex flex-col xs:flex-row gap-4 xs:gap-6 mt-8 mb-2 w-full justify-center items-center"
                    style={{ zIndex: 20, position: 'relative' }}
                  >
                    <Link
                      href="/products"
                      role="button"
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-base font-semibold px-8 py-3 shadow-md rounded-lg bg-brown text-beige hover:scale-105 hover:shadow-lg active:scale-95 focus:ring-2 focus:ring-accent transition-transform"
                    >
                      Shop Now
                    </Link>
                    <Link
                      href="/events"
                      role="button"
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-base font-semibold px-8 py-3 shadow-md rounded-lg bg-accent text-brown hover:scale-105 hover:shadow-lg active:scale-95 focus:ring-2 focus:ring-accent transition-transform"
                    >
                      Plan an Event
                    </Link>
                  </div>
                </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
