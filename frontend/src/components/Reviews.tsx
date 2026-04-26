"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const Star: React.FC<{ filled?: boolean }> = ({ filled = false }) => (
  <svg
    className={`w-4 h-4 ${filled ? "text-amber-400" : "text-amber-200"}`}
    viewBox="0 0 20 20"
    fill={filled ? "currentColor" : "none"}
    aria-hidden
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.963 9.386c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
  </svg>
);

type Review = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  text: string;
  source?: string;
  featuredImage: string;
};

const reviews: Review[] = [
  {
    id: "r1",
    name: "Priya S.",
    initials: "PS",
    rating: 5,
    text: "The roses arrived fresh and exactly like the photos. Packaging was secure and delivery was on time.",
    source: "Verified buyer",
    featuredImage:
      "https://cdn.shopify.com/s/files/1/0047/4637/9362/products/CF1_6.jpg?v=1664723427",
  },
  {
    id: "r2",
    name: "Rahul K.",
    initials: "RK",
    rating: 5,
    text: "Excellent support for our office event. The team helped us pick flowers that held up all day.",
    source: "Corporate order",
    featuredImage:
      "https://cdn.shopify.com/s/files/1/0047/4637/9362/products/WES_4079_60de86c7-3385-4b2e-850d-297d9c8e2dfb.jpg?v=1722409287",
  },
  {
    id: "r3",
    name: "Anjali M.",
    initials: "AM",
    rating: 4,
    text: "Great flower quality and clear updates from confirmation to delivery.",
    source: "Website order",
    featuredImage:
      "https://cdn.shopify.com/s/files/1/0047/4637/9362/products/WES_3378.jpg?v=1621319809",
  },
  {
    id: "r4",
    name: "Vikram P.",
    initials: "VP",
    rating: 5,
    text: "The orchid selection looked premium and lasted well. Will definitely reorder.",
    source: "Repeat customer",
    featuredImage:
      "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5647.jpg?v=1709453067",
  },
];

const socialImages = [
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5577.jpg?v=1709440942",
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5536.jpg?v=1709440820",
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_2854-2.jpg?v=1683533409",
];

export default function Reviews() {
  return (
    <section className="section-shell mt-12">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="pill mb-3">Client feedback</div>
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            Reviews & Social Proof
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Real order feedback and imagery reflecting the current floral catalog.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/contact" className="text-olive-green font-semibold underline-offset-4 hover:underline">
            Share your feedback
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {reviews.map((r) => (
          <article key={r.id} className="section-card p-4 bg-white/90 flex flex-col gap-3 border border-olive-green/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-olive-green/15 text-olive-green font-semibold text-sm flex items-center justify-center flex-shrink-0">
                {r.initials}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{r.name}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500">{r.source}</div>
              </div>
            </div>

            <div className="relative w-full h-28 rounded-lg overflow-hidden">
              <Image src={r.featuredImage} alt={`${r.name} review`} fill className="object-cover" />
            </div>

            <div className="flex items-center gap-2" aria-label={`Rated ${r.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={`${r.id}-star-${i}`} filled={i < r.rating} />
              ))}
            </div>

            <p className="text-sm text-slate-700 flex-1 leading-relaxed">{r.text}</p>

            <div className="text-xs uppercase tracking-[0.16em] text-olive-green/70">Posted recently</div>
          </article>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-xs uppercase tracking-[0.16em] text-olive-green/70 mb-3">
          Recent catalog shots
        </h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {socialImages.map((src, idx) => (
            <Link
              key={`social-${idx}`}
              href="/products"
              className="w-32 h-32 rounded-lg overflow-hidden shadow-[0_12px_26px_rgba(24,20,13,0.12)] flex-shrink-0 relative"
            >
              <Image src={src} alt={`Catalog preview ${idx + 1}`} fill className="object-cover" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
