"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

import a1 from "../assets/test1.png";
import a2 from "../assets/test2.png";
import a3 from "../assets/test3.png";
import a4 from "../assets/test4.png";
import ig1 from "../assets/gallery1.png";
import ig2 from "../assets/gallery2.png";
import ig3 from "../assets/gallery3.png";

const Star: React.FC<{ filled?: boolean }> = ({ filled = false }) => (
  <svg className={`w-4 h-4 ${filled ? "text-amber-400" : "text-amber-200"}`} viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} aria-hidden>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.963 9.386c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
  </svg>
);

import type { StaticImageData } from 'next/image';

type Review = {
  id: string;
  name: string;
  avatar: StaticImageData;
  rating: number;
  text: string;
  source?: string;
};

const reviews: Review[] = [
  {
    id: "r1",
    name: "Priya S.",
    avatar: a1,
    rating: 5,
    text: "Beautiful bouquet — arrived on time and lasted a week. The recipient loved the colours!",
    source: "Verified buyer",
  },
  {
    id: "r2",
    name: "Rahul K.",
    avatar: a2,
    rating: 5,
    text: "Amazing quality and packaging. Will order again for events.",
    source: "Verified buyer",
  },
  {
    id: "r3",
    name: "Anjali M.",
    avatar: a3,
    rating: 4,
    text: "Lovely stems and fragrance. Good customer support too.",
    source: "Instagram",
  },
  {
    id: "r4",
    name: "Vikram P.",
    avatar: a4,
    rating: 5,
    text: "Exceeded expectations — the vase set was a perfect addition.",
    source: "Verified buyer",
  },
];

export default function Reviews() {
  return (
    <section className="w-full max-w-6xl mx-auto mt-10 px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Reviews & Social Proof</h2>
          <p className="mt-1 text-sm text-slate-500">Real customer testimonials and recent social mentions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="#reviews-full" className="text-olive-green font-medium hover:underline">Read all reviews</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {reviews.slice(0, 4).map((r) => (
          <article key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                <Image src={r.avatar} alt={r.name} width={48} height={48} className="object-cover" />
              </div>
              <div>
                <div className="font-medium text-slate-900">{r.name}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500">{r.source}</div>
              </div>
            </div>

            <div className="flex items-center gap-2" aria-label={`Rated ${r.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} filled={i < r.rating} />
              ))}
            </div>

            <p className="text-sm text-slate-700 flex-1">{r.text}</p>

            <div className="text-xs text-slate-400">Posted recently</div>
          </article>
        ))}
      </div>

      {/* Small Instagram mentions row */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Recent on Instagram</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <Link href="https://instagram.com" target="_blank" className="w-32 h-32 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
            <Image src={ig1} alt="ig1" width={128} height={128} className="object-cover" />
          </Link>
          <Link href="https://instagram.com" target="_blank" className="w-32 h-32 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
            <Image src={ig2} alt="ig2" width={128} height={128} className="object-cover" />
          </Link>
          <Link href="https://instagram.com" target="_blank" className="w-32 h-32 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
            <Image src={ig3} alt="ig3" width={128} height={128} className="object-cover" />
          </Link>
        </div>
      </div>
    </section>
  );
}
