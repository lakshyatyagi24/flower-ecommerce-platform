'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { mockHeroSlides } from '../modules/hero/mockHeroSlides';

export default function Hero() {

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
        <div className="absolute inset-0 bg-black/50 z-0" aria-hidden="true"></div>
        <Swiper
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          autoplay={{ delay: 5000 }}
          keyboard={{ enabled: true }}
          role="region"
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
                <div className="absolute inset-0 bg-gradient-to-t from-beige/90 via-beige/75 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center items-center z-10 text-center px-4">
                  <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
                    Petal & Twine
                  </h1>
                  <p className="text-xl md:text-2xl text-white mb-1 font-medium drop-shadow-sm max-w-2xl">
                    {slide.tagline}
                  </p>
                  <span className="text-base md:text-lg text-white mb-2 block font-serif italic">
                    Lovingly crafted florals, delivered fresh
                    </span>
                  </div>
                  <div
                    className="flex flex-col xs:flex-row gap-4 xs:gap-6 mt-8 mb-2 w-full justify-center items-center"
                    style={{ zIndex: 20, position: 'relative' }}
                  >
                    <Link
                      href="/products"
                      className="border border-black text-base font-semibold px-8 py-3 shadow-md rounded-lg bg-accent text-white hover:bg-white hover:text-accent transition"
                    >
                      Shop Now
                    </Link>
                    <Link
                      href="/events"
                      className="border border-black text-accent bg-white/80 hover:bg-accent hover:text-white transition font-semibold text-base rounded-lg px-8 py-3"
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
