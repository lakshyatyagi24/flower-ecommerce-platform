"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import s1 from "../assets/slider1.png";
import s2 from "../assets/slider2.png";
import s3 from "../assets/slider3.png";
import s4 from "../assets/slider4.png";
import s5 from "../assets/slider5.png";
import s6 from "../assets/slider6.png";

type Product = {
  id: string;
  title: string;
  category?: string;
  img: typeof s1;
  price: string;
  badge?: string;
};

const products: Product[] = [
  { id: "na1", title: "Blossom Bundle", category: "Bouquets", img: s1, price: "₹750.00", badge: "New" },
  { id: "na2", title: "Tulip Treat", category: "Seasonal", img: s2, price: "₹499.00", badge: "New" },
  { id: "na3", title: "Orchid Luxe", category: "Premium", img: s3, price: "₹1,250.00", badge: "New" },
  { id: "na4", title: "Carnation Joy", category: "Everyday", img: s4, price: "₹399.00", badge: "New" },
  { id: "na5", title: "Lily Grace", category: "Gifts", img: s5, price: "₹999.00", badge: "New" },
  { id: "na6", title: "Spring Mix", category: "Seasonal", img: s6, price: "₹650.00", badge: "New" },
];

export default function NewArrivals() {
  const [adding, setAdding] = useState<Record<string, boolean>>({});
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({});

  function handleAdd(id: string) {
    setAdding((s) => ({ ...s, [id]: true }));
    setTimeout(() => setAdding((s) => ({ ...s, [id]: false })), 1500);
  }

  function handleWishlist(id: string) {
    setWishlisted((s) => ({ ...s, [id]: true }));
    setTimeout(() => setWishlisted((s) => ({ ...s, [id]: false })), 1500);
  }

  return (
    <section className="w-full max-w-6xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">New Arrivals</h2>
          <p className="mt-1 text-sm text-slate-500">Freshly added bouquets & seasonal stems to discover.</p>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="#" className="text-olive-green font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded px-2 py-1">View All</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <article key={p.id} className="bg-white rounded-2xl shadow-sm border border-olive-green/10 overflow-hidden flex flex-col">
            <div className="relative w-full h-44 sm:h-48">
              {p.badge && <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium shadow">{p.badge}</span>}
              <Image src={p.img} alt={p.title} fill className="object-cover" />
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <p className="text-[11px] uppercase tracking-wide text-olive-green/70 font-medium">{p.category}</p>
              <h3 className="mt-1 font-semibold text-sm text-slate-900 line-clamp-2">{p.title}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-bold text-slate-900">{p.price}</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => handleAdd(p.id)} aria-pressed={!!adding[p.id]} className={`flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40 transition ${adding[p.id] ? 'opacity-90' : 'hover:opacity-95'}`} style={{ backgroundColor: adding[p.id] ? '#6F7750' : '#7C835A' }}>
                  {adding[p.id] ? (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M3 3h2l.4 2M7 13h10l3-8H6.4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="10" cy="19" r="1" fill="currentColor" />
                        <circle cx="18" cy="19" r="1" fill="currentColor" />
                      </svg>
                      <span>Quick Add</span>
                    </>
                  )}
                </button>
                <button onClick={() => handleWishlist(p.id)} aria-label={`Wishlist ${p.title}`} className={`w-10 h-10 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 transition ${wishlisted[p.id] ? 'bg-rose-50 text-rose-500 border-rose-300' : ''}`}>
                  {wishlisted[p.id] ? (
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z"/></svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z"/></svg>
                  )}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
