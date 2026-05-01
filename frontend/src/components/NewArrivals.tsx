"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, ApiProduct } from "../lib/api";
import { useCart } from "../lib/cart-context";

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1490750967868-88df5691cc0f?w=400&q=80';
const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden animate-pulse bg-white">
      <div className="h-44 sm:h-52 bg-slate-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-slate-100 rounded w-20" />
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-1/3 mt-2" />
        <div className="h-9 bg-slate-100 rounded-full mt-3" />
      </div>
    </div>
  );
}

export default function NewArrivals() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<Record<string, boolean>>({});
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.listProducts({ take: 8 })
      .then((r) => setProducts(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { add } = useCart();

  function handleAdd(p: ApiProduct) {
    if (p.saleMode === "ENQUIRY") return;
    add(
      {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        image: p.image,
        saleMode: p.saleMode,
        gstRate: p.gstRate,
      },
      1,
    );
    const id = String(p.id);
    setAdding((s) => ({ ...s, [id]: true }));
    setTimeout(() => setAdding((s) => ({ ...s, [id]: false })), 1500);
  }

  function handleWishlist(id: string) {
    setWishlisted((s) => ({ ...s, [id]: !s[id] }));
  }

  return (
    <section className="section-shell mt-12">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="pill mb-3">Just in</div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">New Arrivals</h2>
          <p className="mt-1 text-sm text-slate-600">Freshly added cut flowers — roses, orchids, lilies and seasonal stems.</p>
        </div>
        <Link href="/products" className="text-olive-green font-semibold underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded px-2 py-1 text-sm">View All</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((p) => {
              const imgSrc = p.image || FALLBACK_IMG;
              const sid = String(p.id);
              return (
                <article key={p.id} className="section-card overflow-hidden flex flex-col group hover:shadow-xl transition-shadow duration-300">
                  <div className="relative w-full h-44 sm:h-52 overflow-hidden">
                    <span className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-sm">New</span>
                    <Image
                      src={imgSrc}
                      alt={p.name}
                      fill
                      sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[11px] text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">Same-day available</span>
                      <span className="px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">Fresh stems</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-olive-green/70 font-semibold">
                      {p.category?.name || 'Cut Flowers'}
                    </p>
                    <h3 className="mt-1 font-semibold text-base text-slate-900 line-clamp-2 flex-1">{p.name}</h3>
                    <div className="mt-2 font-bold text-slate-900">
                      {p.saleMode === 'ENQUIRY' ? <span className="text-base">On enquiry</span> : fmt.format(p.price)}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {p.saleMode === 'ENQUIRY' ? (
                        <Link
                          href={`/products/${p.slug}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white bg-olive-green shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
                        >
                          Enquire
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleAdd(p)}
                          aria-pressed={!!adding[sid]}
                          aria-label={`${adding[sid] ? 'Added' : 'Add to cart'} — ${p.name}`}
                          className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white bg-olive-green shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40 transition-all ${adding[sid] ? 'opacity-80' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
                        >
                          {adding[sid] ? (
                            <>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                              Added
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 3h2l.4 2M7 13h10l3-8H6.4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="19" r="1" fill="currentColor" /><circle cx="18" cy="19" r="1" fill="currentColor" /></svg>
                              Quick Add
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleWishlist(sid)}
                        aria-label={`${wishlisted[sid] ? 'Remove from' : 'Save to'} wishlist — ${p.name}`}
                        className={`w-10 h-10 inline-flex items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${wishlisted[sid] ? 'bg-rose-50 text-rose-500 border-rose-300' : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200'}`}
                      >
                        {wishlisted[sid]
                          ? <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                          : <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                        }
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
        }
      </div>
    </section>
  );
}
