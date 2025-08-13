'use client';
import Image from 'next/image';
import Link from 'next/link';
import { mockHeroSlides } from '../modules/hero/mockHeroSlides';

// Classic colors
const COLORS = {
  bg: '#F8F8F6',
  overlayFrom: 'rgba(255, 255, 255, 0.85)',
  overlayTo: 'rgba(195, 231, 131, 0.16)', // olive
  fgDark: '#232323',
  fgAccent: '#A3B18A', // olive
  fgGold: '#ffbb00ff', // gold
  fgGreen: '#283618', // forest
};

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
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(120deg, rgba(255,255,255,0.46) 65%, rgba(163,177,138,0.07) 100%)',
          backdropFilter: 'blur(2.5px)', // was blur(10px)+
          boxShadow: '0 8px 36px 6px rgba(44,44,44,0.08)',
          borderRadius: '2rem',
          border: '1.5px solid rgba(255,255,255,0.23)',
        }}
      />

      {/* Hero content w/ depth, shadow, smooth entry */}
      <div
        className="relative z-20 w-full max-w-4xl px-6 py-20 mx-auto text-center flex flex-col items-center"
        style={{
          boxShadow: '32px 32px 32px 32px rgba(44,44,44,0.08)',
          borderRadius: '2rem',
        }}
      >
        {/* Staggered animation classes */}
        <h1
          className="font-serif text-[clamp(3.1rem,8vw,5.5rem)] font-bold text-[#232323] mb-4 tracking-tight"
          style={{
            textShadow: `0 3px 24px ${COLORS.overlayTo}, 0 1px 0 #fff`,
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            animation: 'slide-up 0.7s cubic-bezier(0.5, 0, 0.16, 1) both',
          }}
        >
          Petal &amp; Twine
        </h1>
        <p
          className="text-2xl md:text-3xl font-sans text-[#283618] mb-3 italic font-bold"
          style={{
            letterSpacing: '0.4px',
            animation: 'fade-in 0.7s cubic-bezier(0.5,0,0.18,1) 0.3s both',
          }}
        >
          Florals for Every Occasion—Style, Heart & Luxury
        </p>
        <span
          className="font-serif text-xl md:text-2xl mb-10 block italic font-bold"
          style={{
            color: COLORS.fgDark,
            fontWeight: 700,
            textShadow: `0 1px 12px ${COLORS.overlayTo}`,
            animation: 'fade-in 0.9s cubic-bezier(0.5,0,0.18,1) 0.55s both',
          }}
        >
          Lovingly crafted & delivered fresh, always with joy
        </span>
        {/* Buttons: pill-shaped, tactile, focusable */}
        <div
          className="flex gap-6 mt-2 justify-center"
          style={{ animation: 'bottom-up 0.8s cubic-bezier(0.5,0,0.18,1) 0.8s both' }}
        >
          <Link
            href="/products"
            className="
    px-8 py-3 text-lg rounded-full font-semibold
    bg-[#7A8450] text-[#232323]
    border border-[#A3B18A] shadow-md
    hover:bg-[#283618] hover:text-[#F8F8F6] hover:scale-105
    transition-all duration-300
    focus-visible:outline focus-visible:ring-2 focus:ring-[#E3C77B]
  "
          >
            Shop Bouquets
          </Link>

          <Link
            href="/events"
            className="
              px-8 py-3 text-lg rounded-full font-semibold
              bg-[#F8F8F6] text-[#283618] border border-[#E3C77B] shadow-sm
              hover:bg-[#E3C77B] hover:text-[#232323]
              focus-visible:outline focus-visible:ring-2 focus:ring-[#A3B18A]
              transition-all duration-300
            "
          >
            Plan An Event
          </Link>
        </div>
        {/* Scroll cue: minimal, post-animation */}
        <div
          className="mt-16 flex flex-col items-center opacity-70 pointer-events-none"
          style={{ animation: 'bounce-slow 2.3s infinite 1.1s' }}
        >
          <svg className="w-7 h-7" style={{ color: '#A3B18A' }} fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="14" r="3" fill="#E3C77B" opacity="0.7" />
            <path stroke="currentColor" strokeWidth="2" d="M12 7v10m0 0l4-4m-4 4l-4-4" />
          </svg>

          <span className="text-xs" style={{ color: COLORS.fgGreen, marginTop: '3px' }}>
            Scroll
          </span>
        </div>
      </div>
    </section>
  );
}
