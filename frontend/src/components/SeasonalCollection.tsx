"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import s7 from "../assets/test6.png";
import { api, ApiProduct } from "../lib/api";

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1490750967868-88df5691cc0f?w=400&q=80';
const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden animate-pulse bg-white">
      <div className="h-28 sm:h-32 bg-slate-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function SeasonalCollection() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listProducts({ category: 'cut-flowers', take: 6 })
      .then((r) => setProducts(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section-shell mt-12">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="pill mb-3">Seasonal curation</div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">Fresh Cut Flowers</h2>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Farm-fresh stems — roses, orchids, sunflowers, lilies and more. Perfect for arrangements, gifting, and brightening any space.
          </p>
        </div>
        <Link href="/products" className="text-olive-green font-semibold underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded px-2 py-1 text-sm">Explore All</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Banner */}
        <div className="lg:col-span-5 rounded-[22px] overflow-hidden shadow-[0_28px_70px_rgba(24,20,13,0.12)] relative min-h-[300px]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f8f1e8]/90 via-[#f1e3d5]/70 to-[#e7d8c7]/80" />
          <Image src={s7} alt="Fresh cut flowers from Indian farms" fill className="object-cover mix-blend-multiply" />
          <div className="relative z-10 p-8 lg:p-10 flex flex-col h-full justify-center text-slate-900">
            <p className="pill w-fit mb-3">Farm fresh</p>
            <h3 className="text-2xl md:text-3xl font-semibold">Nature's finest blooms</h3>
            <p className="mt-2 text-sm text-slate-700 max-w-sm leading-relaxed">
              Hand-selected cut flowers delivered fresh — vibrant colours, long-lasting stems, and natural fragrance for every occasion.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 items-center">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-[#4a3b2a] text-white px-5 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
                Shop Flowers
              </Link>
              <span className="text-xs uppercase tracking-[0.14em] text-olive-green/70 font-medium">Same-day delivery</span>
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((p) => (
                <article key={p.id} className="section-card overflow-hidden flex flex-col group hover:shadow-lg transition-shadow duration-200">
                  <div className="relative w-full h-28 sm:h-36 overflow-hidden">
                    <Image
                      src={p.image || FALLBACK_IMG}
                      alt={p.name}
                      fill
                      sizes="(max-width:1024px) 33vw,20vw"
                      className="object-cover transition-transform duration-400 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-2 bottom-2 flex items-center justify-between text-[10px] text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">Fresh stems</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">Gift-ready</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-xs text-slate-900 line-clamp-2 leading-snug">{p.name}</h4>
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className="font-bold text-sm text-olive-green">{fmt.format(p.price)}</span>
                      <Link href={`/products/${p.slug}`} className="text-xs text-slate-500 hover:text-olive-green hover:underline transition-colors">View</Link>
                    </div>
                  </div>
                </article>
              ))
          }
        </div>
      </div>
    </section>
  );
}
