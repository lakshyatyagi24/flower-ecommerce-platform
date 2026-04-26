"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import s7 from "../assets/test6.png";
import { api, ApiProduct } from "../lib/api";

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1490750967868-88df5691cc0f?w=400&q=80';
const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export default function SeasonalCollection() {
  const [products, setProducts] = useState<ApiProduct[]>([]);

  useEffect(() => {
    api.listProducts({ category: 'cut-flowers', take: 6 })
      .then((r) => setProducts(r.items))
      .catch(() => {});
  }, []);

  return (
    <section className="section-shell mt-12">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="pill mb-3">Seasonal curation</div>
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">Fresh Cut Flowers</h2>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">Farm-fresh stems — roses, orchids, sunflowers, lilies and more. Perfect for arrangements, gifting, and brightening any space.</p>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/products" className="text-olive-green font-semibold underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded px-2 py-1">Explore All</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Banner */}
        <div className="lg:col-span-6 rounded-[22px] overflow-hidden shadow-[0_28px_70px_rgba(24,20,13,0.12)] relative min-h-[320px]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f8f1e8]/90 via-[#f1e3d5]/70 to-[#e7d8c7]/80" />
          <Image src={s7} alt="Fresh cut flowers banner" fill className="object-cover mix-blend-multiply" />
          <div className="relative z-10 p-8 lg:p-12 flex flex-col h-full justify-center text-slate-900">
            <p className="pill w-fit mb-3">Farm fresh</p>
            <h3 className="text-3xl font-semibold">Nature's finest blooms</h3>
            <p className="mt-2 text-sm text-slate-700 max-w-lg">Hand-selected cut flowers delivered fresh — vibrant colours, long-lasting stems, and natural fragrance for every occasion.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-[#4a3b2a] text-white px-5 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">Shop Flowers</Link>
              <span className="text-xs uppercase tracking-[0.16em] text-olive-green/70">Same-day in Mumbai &amp; NCR</span>
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-2 gap-4">
          {products.map((p) => (
            <article key={p.id} className="section-card overflow-hidden flex flex-col group">
              <div className="relative w-full h-28 sm:h-32">
                <Image
                  src={p.image || FALLBACK_IMG}
                  alt={p.name}
                  fill
                  sizes="(max-width:1024px) 50vw,25vw"
                  className="object-cover transition duration-400 group-hover:scale-105"
                />
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[10px] text-white/90 opacity-0 group-hover:opacity-100 transition">
                  <span className="px-2 py-1 rounded-full bg-black/35">Fresh stems</span>
                  <span className="px-2 py-1 rounded-full bg-black/35">Gift-ready</span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm text-slate-900 line-clamp-2">{p.name}</h4>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-bold text-olive-green">{fmt.format(p.price)}</span>
                  <Link href={`/products/${p.slug}`} className="text-olive-green text-sm font-medium hover:underline">View</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
