"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import ig1 from "../assets/gallery1.png";
import ig2 from "../assets/gallery2.png";
import ig3 from "../assets/gallery3.png";

const Star: React.FC<{ filled?: boolean }> = ({ filled = false }) => (
  <svg className={`w-4 h-4 ${filled ? "text-amber-400" : "text-amber-200"}`} viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} aria-hidden>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.963 9.386c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
  </svg>
);

const AVATAR_COLORS: Record<string, string> = {
  P: "bg-rose-100 text-rose-700",
  R: "bg-amber-100 text-amber-800",
  A: "bg-emerald-100 text-emerald-700",
  V: "bg-violet-100 text-violet-700",
  S: "bg-sky-100 text-sky-700",
};

function Avatar({ name }: { name: string }) {
  const initial = name[0].toUpperCase();
  const colorClass = AVATAR_COLORS[initial] ?? "bg-slate-100 text-slate-600";
  return (
    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ${colorClass}`} aria-hidden>
      {initial}
    </div>
  );
}

type Review = {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  product: string;
  date: string;
};

const reviews: Review[] = [
  {
    id: "r1",
    name: "Priya S.",
    location: "Bangalore",
    rating: 5,
    text: "My Blue Gardenia arrived perfectly fresh — the hydrangeas and oriental lilies were breathtaking. Packaging was immaculate and it lasted over a week!",
    product: "Blue Gardenia",
    date: "2 days ago",
  },
  {
    id: "r2",
    name: "Rahul K.",
    location: "Delhi NCR",
    rating: 5,
    text: "Ordered the Celebration Hamper for our anniversary. Flowers, chocolates and the candle were all premium quality. Delivery was on time and the presentation was stunning.",
    product: "Celebration Hamper",
    date: "5 days ago",
  },
  {
    id: "r3",
    name: "Anjali M.",
    location: "Mumbai",
    rating: 5,
    text: "The cut flowers I ordered — oriental lilies and fresh roses — were incredibly vibrant. Same-day delivery worked perfectly. Will absolutely order again for every occasion.",
    product: "Oriental Lily (Pearl White)",
    date: "1 week ago",
  },
  {
    id: "r4",
    name: "Vikram P.",
    location: "Hyderabad",
    rating: 5,
    text: "The Orchid Grace was the perfect birthday gift — my mother was overjoyed. The ceramic pot is a beautiful keeper even after the blooms are done. 10/10.",
    product: "Orchid Grace",
    date: "2 weeks ago",
  },
];

export default function Reviews() {
  return (
    <section className="section-shell mt-12">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="pill mb-3">Customer love</div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">What Our Customers Say</h2>
          <p className="mt-1 text-sm text-slate-600">Real reviews from verified buyers across India.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <span className="flex">
            {[...Array(5)].map((_, i) => <Star key={i} filled />)}
          </span>
          <span className="font-semibold ml-1">4.9</span>
          <span className="text-slate-400">· 200+ reviews</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {reviews.map((r) => (
          <article key={r.id} className="section-card p-5 bg-white/90 flex flex-col gap-3 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center gap-3">
              <Avatar name={r.name} />
              <div>
                <div className="font-semibold text-slate-900 text-sm">{r.name}</div>
                <div className="text-xs text-slate-500">{r.location} · Verified buyer</div>
              </div>
            </div>

            <div className="flex items-center gap-0.5" aria-label={`Rated ${r.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} filled={i < r.rating} />
              ))}
            </div>

            <p className="text-sm text-slate-700 flex-1 leading-relaxed">{r.text}</p>

            <div className="flex items-center justify-between text-xs">
              <span className="text-olive-green font-medium truncate pr-2">{r.product}</span>
              <span className="text-slate-400 flex-shrink-0">{r.date}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-xs uppercase tracking-[0.16em] text-olive-green/70 mb-3">Recent on Instagram</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {[ig1, ig2, ig3].map((img, i) => (
            <Link
              key={i}
              href="https://instagram.com/freshpetalsindia"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Fresh Petals India on Instagram — post ${i + 1}`}
              className="w-32 h-32 rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(24,20,13,0.14)] flex-shrink-0 hover:opacity-90 transition-opacity"
            >
              <Image src={img} alt={`Fresh Petals India event ${i + 1}`} width={128} height={128} className="object-cover w-full h-full" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
