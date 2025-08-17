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
    <section className="w-full max-w-6xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Seasonal Collection — Autumn Rustic</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">A curated selection of earthy, artisanal arrangements inspired by autumnal tones and handcrafted textures — perfect for gifting or warming your space this season.</p>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/products?collection=autumn-rustic" className="text-olive-green font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded px-2 py-1">Explore All</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Banner with rustic texture (SVG data URL) */}
        <div className="lg:col-span-6 rounded-2xl overflow-hidden shadow-sm flex items-stretch">
          <div className="relative w-full h-64 lg:h-full bg-amber-50 flex items-center">
            <Image src={s7} alt="Autumn Rustic banner" fill className="object-cover" />

            <div className="relative z-10 p-6 lg:p-12 flex flex-col h-full justify-center">
              <h3 className="text-2xl font-semibold text-slate-900">Autumn Rustic</h3>
              <p className="mt-2 text-sm text-slate-700 max-w-md">Hand-tied stems, natural textures and warm tones. Shop a seasonal edit crafted for an earthy, artisanal look.</p>
              <div className="mt-4">
                <Link href="/products?collection=autumn-rustic" className="inline-flex items-center gap-2 rounded-md bg-olive-green text-white px-4 py-2 text-sm font-medium shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-olive-green/40">Shop Collection</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Featured SKUs */}
        <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-2 gap-4">
          {featured.map((p) => (
            <article key={p.id} className="bg-white rounded-2xl shadow-sm border border-olive-green/8 overflow-hidden flex flex-col">
              <div className="relative w-full h-28 sm:h-32">
                <Image src={p.img} alt={p.title} fill className="object-cover" />
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm text-slate-900 line-clamp-2">{p.title}</h4>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-bold text-slate-900">{p.price}</span>
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
