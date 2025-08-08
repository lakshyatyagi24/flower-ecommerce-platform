'use client';
import { useState } from 'react';
import { mockTestimonials } from '@/modules/testimonials/mockTestimonials';
import Avatar from 'react-avatar';
import Link from 'next/link';

export default function TestimonialsSection() {
  const [idx, setIdx] = useState(0);

  const prev = () => setIdx((i) => (i === 0 ? mockTestimonials.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === mockTestimonials.length - 1 ? 0 : i + 1));
  const review = mockTestimonials[idx];

  return (
    <section className="py-16 max-w-3xl mx-auto px-4">
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-brown-800 mb-9 text-center">
        What Our Customers Say
      </h2>
      <div className="relative bg-white/80 border border-olive-200 rounded-2xl shadow-xl p-8 flex flex-col md:flex-row items-center gap-6 transition-all duration-500">
        <div className="flex-shrink-0">
          <Avatar
            name={review.name}
            size="96"
            round={true}
            color="#ec8112"
            fgColor="#fff"
            className="border-4 border-accent shadow-md"
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <p className="font-serif text-lg text-brown-800 italic mb-3">
            &quot;{review.quote}&quot;
          </p>
          <div className="font-semibold text-accent">
            {review.name}
            <span className="block text-xs text-olive-dark font-normal mt-0.5">{review.event}</span>
          </div>
        </div>

        {/* Nav arrows */}
        <button
          onClick={prev}
          aria-label="Previous Testimonial"
          className="absolute -left-6 top-1/2 -translate-y-1/2 bg-beige rounded-full border border-accent p-2 text-accent shadow hover:bg-accent hover:text-white transition z-10"
        >
          &#8592;
        </button>
        <button
          onClick={next}
          aria-label="Next Testimonial"
          className="absolute -right-6 top-1/2 -translate-y-1/2 bg-beige rounded-full border border-accent p-2 text-accent shadow hover:bg-accent hover:text-white transition z-10"
        >
          &#8594;
        </button>
      </div>
      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {mockTestimonials.map((_, i) => (
          <button
            key={i}
            aria-label={`Show testimonial ${i + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition ${i === idx ? 'bg-accent' : 'bg-olive-200'}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
      {/* Read more button */}
      <div className="flex justify-center mt-7">
        <Link
          href="/reviews"
          className="border border-accent text-accent font-semibold px-6 py-2.5 rounded-full bg-white hover:bg-accent hover:text-white shadow-sm transition text-base"
        >
          Read More Reviews
        </Link>
      </div>
    </section>
  );
}
