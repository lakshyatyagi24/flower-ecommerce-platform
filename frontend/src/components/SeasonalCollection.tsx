"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

import s1 from "../assets/slider1.png";
import s2 from "../assets/slider2.png";
import s3 from "../assets/slider3.png";
import s4 from "../assets/slider4.png";
import s5 from "../assets/slider5.png";
import s6 from "../assets/slider6.png";
import s7 from "../assets/test6.png";

type Product = {
  id: string;
  title: string;
  img: typeof s1;
  price: string;
};

const featured: Product[] = [
  { id: "sc1", title: "Autumn Bouquet", img: s1, price: "\u20b9750.00" },
  { id: "sc2", title: "Rustic Wrap", img: s2, price: "\u20b9499.00" },
  { id: "sc3", title: "Heritage Spray", img: s3, price: "\u20b91,150.00" },
  { id: "sc4", title: "Fireside Posy", img: s4, price: "\u20b9399.00" },
  { id: "sc5", title: "Moss & Fern", img: s5, price: "\u20b9999.00" },
  { id: "sc6", title: "Woodland Mix", img: s6, price: "\u20b9650.00" },
];

export default function SeasonalCollection() {
  return (
    <section className="section-shell mt-12">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="pill mb-3">Seasonal curation</div>
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">Seasonal Collection — Autumn Rustic</h2>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">Earthy, artisanal arrangements inspired by autumnal tones, hand-tied with textured wraps for gifting and luminous evenings.</p>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/products?collection=autumn-rustic" className="text-olive-green font-semibold underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded px-2 py-1">Explore All</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Banner */}
        <div className="lg:col-span-6 rounded-[22px] overflow-hidden shadow-[0_28px_70px_rgba(24,20,13,0.12)] relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f8f1e8]/90 via-[#f1e3d5]/70 to-[#e7d8c7]/80" />
          <Image src={s7} alt="Autumn Rustic banner" fill className="object-cover mix-blend-multiply" />

          <div className="relative z-10 p-8 lg:p-12 flex flex-col h-full justify-center text-slate-900">
            <p className="pill w-fit mb-3">Autumn edit</p>
            <h3 className="text-3xl font-semibold">Layers of amber & moss</h3>
            <p className="mt-2 text-sm text-slate-700 max-w-lg">Hand-tied stems, natural textures, and warm tones. Shop a seasonal edit crafted for an earthy, artisanal look.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/products?collection=autumn-rustic" className="inline-flex items-center gap-2 rounded-full bg-[#4a3b2a] text-white px-5 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">Shop Collection</Link>
              <span className="text-xs uppercase tracking-[0.16em] text-olive-green/70">Same-day in Mumbai & NCR</span>
            </div>
          </div>
        </div>

        {/* Featured SKUs */}
        <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-2 gap-4">
          {featured.map((p) => (
            <article key={p.id} className="section-card overflow-hidden flex flex-col group">
              <div className="relative w-full h-28 sm:h-32">
                <Image src={p.img} alt={p.title} fill className="object-cover transition duration-400 group-hover:scale-105" />
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[10px] text-white/90 opacity-0 group-hover:opacity-100 transition">
                  <span className="px-2 py-1 rounded-full bg-black/35">Textured wrap</span>
                  <span className="px-2 py-1 rounded-full bg-black/35">Gift-ready</span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm text-slate-900 line-clamp-2">{p.title}</h4>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-bold text-olive-green">{p.price}</span>
                  <Link href="#" className="text-olive-green text-sm font-medium hover:underline">View</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
