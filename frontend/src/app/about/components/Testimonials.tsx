"use client";
import React from "react";
import Image from "next/image";
import p4 from "../../../assets/person4.png";
import p5 from "../../../assets/person5.png";
import p6 from "../../../assets/person6.png";

const testimonials = [
  {
    name: "Sana Kapoor",
    occasion: "Wedding — Bangalore",
    img: p4,
    rating: 5,
    text: "The florals were absolutely breathtaking. The team understood our vision — soft blush and ivory — and executed it beyond our expectations. Every guest asked where we found them!",
  },
  {
    name: "Arjun Mehta",
    occasion: "Corporate Event — Delhi",
    img: p5,
    rating: 5,
    text: "Professional, punctual, and wonderfully creative. The table arrangements elevated our annual gala completely. The team handled 200+ centrepieces with zero hiccups.",
  },
  {
    name: "Priya Shah",
    occasion: "Birthday — Mumbai",
    img: p6,
    rating: 5,
    text: "Warm, personal, and genuinely beautiful. The Blue Gardenia bouquet arrived fresh and stayed vibrant for 10 days. A truly special experience from order to delivery.",
  },
];

export default function Testimonials() {
  return (
    <section aria-labelledby="testimonials" className="mb-14">
      <div className="pill mb-3">Client love</div>
      <h2 id="testimonials" className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight mb-6">
        What clients say
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {testimonials.map((t) => (
          <div key={t.name} className="section-card p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
                <Image src={t.img} alt={t.name} width={48} height={48} className="object-cover" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                <div className="text-xs text-slate-500">{t.occasion}</div>
              </div>
            </div>

            <div className="flex gap-0.5" aria-label={`Rated ${t.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className={`w-4 h-4 ${i < t.rating ? 'text-amber-400' : 'text-amber-100'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.963 9.386c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
                </svg>
              ))}
            </div>

            <p className="text-sm text-slate-600 leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
          </div>
        ))}
      </div>
    </section>
  );
}
