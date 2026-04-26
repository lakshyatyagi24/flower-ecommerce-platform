"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api, ApiProduct } from '../lib/api';
import ProductQuickView, { QuickViewProduct } from './ProductQuickView';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1490750967868-88df5691cc0f?w=400&q=80';

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

const Star: React.FC<{ filled?: boolean }> = ({ filled = false }) => (
  <svg className={`w-4 h-4 ${filled ? 'text-amber-400' : 'text-amber-200'}`} viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} aria-hidden>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.963 9.386c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
  </svg>
);

const BestInFlowers: React.FC = () => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({});
  const [quickViewId, setQuickViewId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: true });

  useEffect(() => {
    api.listProducts({ featured: true, take: 8 })
      .then((r) => setProducts(r.items))
      .catch(() => {});
  }, []);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScroll({ left: el.scrollLeft > 8, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8 });
  }
  useEffect(() => { updateScrollState(); }, [products]);

  function scrollByDir(dir: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.85);
    el.scrollBy({ left: amount * dir, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  }

  function handleAdd(id: string) {
    setAdded((s) => ({ ...s, [id]: true }));
    setTimeout(() => setAdded((s) => ({ ...s, [id]: false })), 2000);
  }

  function handleWishlist(id: string) {
    setWishlisted((s) => ({ ...s, [id]: true }));
    setTimeout(() => setWishlisted((s) => ({ ...s, [id]: false })), 2000);
  }

  const quickViewProduct = quickViewId !== null ? products.find((p) => p.id === quickViewId) : null;

  function toQuickView(p: ApiProduct): QuickViewProduct {
    return {
      id: String(p.id),
      title: p.name,
      category: p.category?.name || 'Cut Flowers',
      img: p.image || FALLBACK_IMG,
      price: p.price,
      description: p.description || undefined,
    };
  }

  return (
    <section className="section-shell mt-12">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="pill mb-3">Freshpetals recommends</div>
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">Best in florals</h2>
          <p className="mt-1 text-sm text-slate-600">Curated favourites with fresh stems, vibrant colours, and natural beauty.</p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => scrollByDir(-1)} disabled={!canScroll.left} aria-label="Scroll left" className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40">
            <svg className="w-4 h-4 text-slate-700" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M12.5 15L7.5 10l5-5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={() => scrollByDir(1)} disabled={!canScroll.right} aria-label="Scroll right" className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40">
            <svg className="w-4 h-4 text-slate-700" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <Link href="/products" className="text-olive-green font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded px-2 py-1">View All</Link>
        </div>
      </div>

      <div ref={scrollRef} onScroll={updateScrollState} className="relative flex gap-6 snap-x overflow-x-auto pb-2 no-scrollbar" role="list" aria-label="Top flower picks">
        {products.map((p, i) => {
          const imgSrc = p.image || FALLBACK_IMG;
          const sid = String(p.id);
          return (
            <article key={p.id} role="listitem" className="group snap-start w-[250px] flex-shrink-0 bg-white rounded-2xl shadow-sm border border-olive-green/10 flex flex-col overflow-hidden focus-within:shadow-lg hover:shadow-lg transition-shadow" style={{ animationName: 'fadeInUp', animationDuration: '420ms', animationFillMode: 'both', animationDelay: `${i * 70}ms` }}>
              <button onClick={() => setQuickViewId(p.id)} aria-label={`Open quick view for ${p.name}`} className="relative w-full h-56 overflow-hidden">
                <Image src={imgSrc} alt={p.name} fill sizes="250px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/90 text-xs font-medium opacity-0 group-hover:opacity-100 transition">Quick View</span>
              </button>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-[11px] uppercase tracking-wide text-olive-green/70 font-medium">Cut Flowers</p>
                <h3 className="mt-1 font-semibold text-base text-slate-900 line-clamp-1">{p.name}</h3>
                <div className="mt-1 flex items-center" aria-label="Rated 5 out of 5">
                  {Array.from({ length: 5 }).map((_, idx) => <Star key={idx} filled />)}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-bold text-slate-900 text-lg">{fmt.format(p.price)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleAdd(sid)}
                    aria-pressed={!!added[sid]}
                    aria-label={`${added[sid] ? 'Added' : 'Add to cart'} ${p.name}`}
                    className={`flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40 transition ${added[sid] ? 'opacity-90' : 'hover:opacity-95'}`}
                    style={{ backgroundColor: added[sid] ? '#6F7750' : '#7C835A' }}
                  >
                    {added[sid] ? (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 3h2l.4 2M7 13h10l3-8H6.4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="19" r="1" fill="currentColor" /><circle cx="18" cy="19" r="1" fill="currentColor" /></svg>
                        <span>Add to cart</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleWishlist(sid)}
                    aria-label={`Wishlist ${p.name}`}
                    className={`w-10 h-10 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 transition ${wishlisted[sid] ? 'bg-rose-50 text-rose-500 border-rose-300' : ''}`}
                  >
                    {wishlisted[sid] ? (
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {quickViewProduct && (
        <ProductQuickView
          open={true}
          product={toQuickView(quickViewProduct)}
          onClose={() => setQuickViewId(null)}
          onAdd={(id) => { handleAdd(id); setQuickViewId(null); }}
        />
      )}
    </section>
  );
};

export default BestInFlowers;
