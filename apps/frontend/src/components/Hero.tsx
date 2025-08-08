'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { mockHeroSlides } from '../modules/hero/mockHeroSlides';

export default function Hero() {
  return (
    <section className="relative max-w-4xl mx-auto py-10 px-4">
      <div className="rounded-xl overflow-hidden relative mb-12 shadow-lg min-h-[320px]">
        <Swiper
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          autoplay={{ delay: 5000 }}
          className="w-full h-80"
        >
          {mockHeroSlides.map((slide, i) => (
            <SwiperSlide key={i}>
              <div className="relative w-full h-80">
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  priority
                  className="object-cover brightness-90 saturate-150 w-full h-80"
                  style={{ minHeight: 320, minWidth: '100%' }}
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
                  <span className="text-accent font-medium mt-1 text-lg drop-shadow-sm">
                    {slide.note}
                  </span>
                  <div className="flex flex-col sm:flex-row gap-3 mt-2 justify-center">
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
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
