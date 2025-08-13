'use client';
import Image from 'next/image';
import Link from 'next/link';
import { mockHeroSlides } from '../modules/hero/mockHeroSlides';

export default function Hero() {
  const slide = mockHeroSlides[0];

  return (
    <section
      className="
        relative w-full min-h-screen flex items-center justify-center overflow-hidden
        bg-[#F8F8F6] pt-20"
      aria-label="Homepage Hero"
    >
      {/* Immersive, bright background florals */}
      <Image
        src={slide.image}
        alt={slide.alt}
        fill
        priority
        quality={100}
        className="object-cover w-full h-full brightness-100 saturate-95"
        style={{ zIndex: 0, objectPosition: 'center center' }}
      />

      {/* Premium frosted glass overlay - two gradients layered */}
      <div className="absolute inset-0 z-10 pointer-events-none hero-overlay" />

      {/* Hero content w/ depth, shadow, smooth entry */}
      <div className="relative z-20 w-full max-w-4xl px-6 py-20 mx-auto text-center flex flex-col items-center hero-content">
        <div className="hero-text-overlay">
          {/* Staggered animation classes */}
          <h1 className="font-serif font-bold text-[#232323] tracking-tight hero-h1">
            Petal &amp; Twine
          </h1>
          <p className="font-sans italic font-bold hero-subtitle">
            Florals for Every Occasion—Style, Heart & Luxury
          </p>
          <span className="font-serif mb-10 block italic font-bold hero-value-line">
            Lovingly crafted & delivered fresh, always with joy
          </span>
        </div>
        {/* Buttons: pill-shaped, tactile, focusable */}
        <div className="flex mt-2 justify-center hero-cta-container">
          <Link href="/products" className="cta cta-primary">
            Shop Bouquets
          </Link>
          <Link href="/events" className="cta cta-secondary">
            Plan An Event
          </Link>
        </div>
        {/* Scroll cue: minimal, post-animation */}
        <div className="mt-16 flex flex-col items-center opacity-70 pointer-events-none hero-scroll-cue">
          <svg className="w-7 h-7" style={{ color: '#A3B18A' }} fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="14" r="3" fill="#E3C77B" opacity="0.7" />
            <path stroke="currentColor" strokeWidth="2" d="M12 7v10m0 0l4-4m-4 4l-4-4" />
          </svg>

          <span className="text-xs" style={{ color: '#283618', marginTop: '3px' }}>
            Scroll
          </span>
        </div>
      </div>
    </section>
  );
}
