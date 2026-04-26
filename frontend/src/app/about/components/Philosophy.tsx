"use client";
import React from "react";

const values = [
  {
    id: "farm",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: "Farm-Direct Freshness",
    desc: "We source directly from sustainable Indian farms — blooms arrive days fresher than traditional florists.",
  },
  {
    id: "craft",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Expert Craftsmanship",
    desc: "Every bouquet is hand-tied by experienced florists who understand colour, structure, and longevity.",
  },
  {
    id: "eco",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: "Sustainable Practices",
    desc: "Zero-waste growing methods and eco-friendly packaging — because every purchase should be good for the planet.",
  },
  {
    id: "delivery",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
    title: "Same-Day Delivery",
    desc: "Order before 3 PM — we deliver across Bangalore, Delhi, Mumbai, Hyderabad, Pune, Chennai and more.",
  },
];

export default function Philosophy() {
  return (
    <section aria-labelledby="our-philosophy" className="mb-14">
      <div className="pill mb-3">Our principles</div>
      <h2 id="our-philosophy" className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight mb-2">
        What we stand for
      </h2>
      <p className="text-slate-600 mb-6 text-sm">The values that guide every bouquet we create and every delivery we make.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {values.map((v) => (
          <div key={v.id} className="section-card p-5 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-200">
            <div className="w-11 h-11 rounded-full bg-[#f1e4d4] flex items-center justify-center text-[#4a3b2a]">
              {v.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{v.title}</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
