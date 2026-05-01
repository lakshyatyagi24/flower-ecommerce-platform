"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api, ApiProduct } from '../lib/api';
import { useCart } from '../lib/cart-context';
import ProductQuickView, { QuickViewProduct } from './ProductQuickView';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1490750967868-88df5691cc0f?w=400&q=80';

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

const Star: React.FC<{ filled?: boolean }> = ({ filled = false }) => (
  <svg className={`w-4 h-4 ${filled ? 'text-amber-400' : 'text-amber-200'}`} viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} aria-hidden>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.963 9.386c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
  </svg>
);

function SkeletonCard() {
  return (
    <div className="w-[250px] flex-shrink-0 bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-56 bg-slate-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-slate-100 rounded w-20" />
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-24" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
        <div className="h-9 bg-slate-100 rounded-md mt-3" />
      </div>
    </div>
  );
}

const BestInFlowers: React.FC = () => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({});
  const [quickViewId, setQuickViewId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: true });

  useEffect(() => {
    api.listProducts({ featured: true, take: 8 })
      .then((r) => setProducts(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
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
    el.scrollBy({ left: Math.round(el.clientWidth * 0.85) * dir, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  }

  const { add } = useCart();

  function handleAdd(product: ApiProduct) {
    if (product.saleMode === 'ENQUIRY') return;
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        saleMode: product.saleMode,
        gstRate: product.gstRate,
      },
      1,
    );
    const id = String(product.id);
    setAdded((s) => ({ ...s, [id]: true }));
    setTimeout(() => setAdded((s) => ({ ...s, [id]: false })), 2000);
  }

  function handleWishlist(id: string) {
    setWishlisted((s) => ({ ...s, [id]: !s[id] }));
  }

  const quickViewProduct = quickViewId !== null ? products.find((p) => p.id === quickViewId) : null;

  function toQuickView(p: ApiProduct): QuickViewProduct {
    return {
      id: String(p.id),
      title: p.name,
      category: p.category?.name || 'Flowers',
      img: p.image || FALLBACK_IMG,
      price: p.price,
      description: p.description || undefined,
    };
  }

  return (
    <section className="section-shell mt-12">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="pill mb-3">Our favourites</div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">Best in Florals</h2>
          <p className="mt-1 text-sm text-slate-600">Curated favourites — vibrant colours, fresh stems, and natural beauty.</p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => scrollByDir(-1)} disabled={!canScroll.left} aria-label="Scroll left" className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center bg-white/90 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40 transition-colors">
            <svg className="w-4 h-4 text-slate-700" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M12.5 15L7.5 10l5-5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={() => scrollByDir(1)} disabled={!canScroll.right} aria-label="Scroll right" className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center bg-white/90 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40 transition-colors">
            <svg className="w-4 h-4 text-slate-700" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <Link href="/products" className="text-olive-green font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded px-2 py-1 text-sm">View All</Link>
        </div>
      </div>

      <div ref={scrollRef} onScroll={updateScrollState} className="flex gap-5 snap-x overflow-x-auto pb-3 no-scrollbar" role="list" aria-label="Featured flower picks">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((p, i) => {
              const imgSrc = p.image || FALLBACK_IMG;
              const sid = String(p.id);
              return (
                <article
                  key={p.id}
                  role="listitem"
                  className="group snap-start w-[250px] flex-shrink-0 bg-white rounded-2xl shadow-sm border border-olive-green/10 flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  style={{ animationName: 'fadeInUp', animationDuration: '420ms', animationFillMode: 'both', animationDelay: `${i * 60}ms` }}
                >
                  <button
                    onClick={() => setQuickViewId(p.id)}
                    aria-label={`Quick view ${p.name}`}
                    className="relative w-full h-56 overflow-hidden"
                  >
                    <Image src={imgSrc} alt={p.name} fill sizes="250px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/95 text-xs font-semibold opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-sm">
                      Quick View
                    </span>
                  </button>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-[11px] uppercase tracking-wide text-olive-green/70 font-medium">
                      {p.category?.name || 'Flowers'}
                    </p>
                    <h3 className="mt-1 font-semibold text-base text-slate-900 line-clamp-1">{p.name}</h3>
                    <div className="mt-1 flex items-center gap-0.5" aria-label="Rated 5 out of 5">
                      {Array.from({ length: 5 }).map((_, idx) => <Star key={idx} filled />)}
                    </div>
                    <div className="mt-2 font-bold text-slate-900 text-lg">
                      {p.saleMode === 'ENQUIRY' ? <span className="text-base">On enquiry</span> : fmt.format(p.price)}
                    </div>
                    <div className="mt-3 flex gap-2">
                      {p.saleMode === 'ENQUIRY' ? (
                        <Link
                          href={`/products/${p.slug}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white bg-olive-green shadow-sm hover:opacity-90 hover:-translate-y-0.5 transition-all"
                        >
                          Enquire now
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleAdd(p)}
                          aria-pressed={!!added[sid]}
                          aria-label={`${added[sid] ? 'Added' : 'Add to cart'} — ${p.name}`}
                          className={`flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white bg-olive-green shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40 transition-all ${added[sid] ? 'opacity-80' : 'hover:opacity-90 hover:-translate-y-0.5'}`}
                        >
                          {added[sid] ? (
                            <>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                              Added
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 3h2l.4 2M7 13h10l3-8H6.4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="19" r="1" fill="currentColor" /><circle cx="18" cy="19" r="1" fill="currentColor" /></svg>
                              Add to cart
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleWishlist(sid)}
                        aria-label={`${wishlisted[sid] ? 'Remove from' : 'Add to'} wishlist — ${p.name}`}
                        className={`w-10 h-10 inline-flex items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${wishlisted[sid] ? 'bg-rose-50 text-rose-500 border-rose-300' : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200'}`}
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

      {quickViewProduct && (
        <ProductQuickView
          open
          product={toQuickView(quickViewProduct)}
          onClose={() => setQuickViewId(null)}
          onAdd={() => { handleAdd(quickViewProduct); setQuickViewId(null); }}
        />
      )}
    </section>
  );
};

export default BestInFlowers;
