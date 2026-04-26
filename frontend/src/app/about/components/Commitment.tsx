"use client";
import React from "react";
import Link from "next/link";

const initiatives = [
  {
    title: "Farm-direct sourcing",
    desc: "We work directly with sustainable small-scale farms in Karnataka, Pune and Tamil Nadu — fresher flowers, fairer prices for growers.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    title: "Eco-friendly packaging",
    desc: "Kraft wraps, compostable sleeves, and recycled materials wherever possible. We are actively eliminating single-use plastic from our supply chain.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
  },
  {
    title: "Zero-waste growing",
    desc: "Our farm partners use zero-waste and sustainable growing methods — no harmful pesticides, composted waste, water-efficient irrigation.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    title: "Community support",
    desc: "A portion of every order supports floriculture education and grower welfare programs in rural India.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Commitment() {
  return (
    <section aria-labelledby="our-commitment" className="mb-14">
      <div className="pill mb-3">Our responsibility</div>
      <h2 id="our-commitment" className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight mb-2">
        Sustainability & Community
      </h2>
      <p className="text-slate-600 mb-6 text-sm">
        Sustainability is not a label — it&apos;s built into how we source, pack, and deliver every order.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {initiatives.map((it) => (
            <div key={it.title} className="section-card bg-white p-4 flex items-start gap-4 hover:shadow-md transition-shadow duration-200">
              <div className="w-10 h-10 rounded-full bg-[#f1e4d4] flex items-center justify-center text-[#4a3b2a] flex-shrink-0">
                {it.icon}
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">{it.title}</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{it.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="section-card bg-gradient-to-br from-[#f8f1e8] to-white p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-3">Why this matters to us</h3>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            The cut-flower industry has historically had a large carbon and chemical footprint. By choosing Indian farms over imported stock, working with growers who use sustainable methods, and eliminating unnecessary packaging, Fresh Petals India is building a supply chain we&apos;re genuinely proud of.
          </p>
          <ul className="space-y-2 text-sm text-slate-600 mb-5">
            <li className="flex items-start gap-2">
              <span className="text-olive-green mt-0.5">✓</span>
              Reduced transport emissions — domestic farms, not international imports
            </li>
            <li className="flex items-start gap-2">
              <span className="text-olive-green mt-0.5">✓</span>
              Lower waste via compostable and recycled packaging materials
            </li>
            <li className="flex items-start gap-2">
              <span className="text-olive-green mt-0.5">✓</span>
              Direct grower partnerships with fair-price commitments
            </li>
          </ul>
          <Link href="/contact" className="text-sm font-semibold text-olive-green hover:underline">
            Talk to us about sustainability →
          </Link>
        </div>
      </div>
    </section>
  );
}
