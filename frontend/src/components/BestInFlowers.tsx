"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ApiProduct, api, formatINR, sanitizeImageUrl } from "@/lib/api";

const FALLBACK_IMG =
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5536.jpg?v=1709440820";

const Star = ({ filled }: { filled: boolean }) => (
  <svg
    className={`w-4 h-4 ${filled ? "text-amber-400" : "text-amber-200"}`}
    viewBox="0 0 20 20"
    fill={filled ? "currentColor" : "none"}
    aria-hidden
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.963 9.386c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
  </svg>
);

function ProductSkeleton() {
  return (
    <div className="w-[250px] flex-shrink-0 rounded-2xl border border-olive-green/10 bg-white overflow-hidden animate-pulse">
      <div className="h-56 bg-slate-100" />
      <div className="p-4">
        <div className="h-3 w-20 bg-slate-100 rounded" />
        <div className="h-5 w-40 bg-slate-100 rounded mt-2" />
        <div className="h-4 w-24 bg-slate-100 rounded mt-3" />
      </div>
    </div>
  );
}

export default function BestInFlowers() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: true });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const featured = await api.listProducts({ featured: true, active: true, take: 12 });
        if (!cancelled && featured.items.length > 0) {
          setProducts(featured.items);
          return;
        }

        const fallback = await api.listProducts({ active: true, take: 12 });
        if (!cancelled) setProducts(fallback.items);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScroll({
      left: el.scrollLeft > 8,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  }

  function scrollByDir(dir: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.85);
    el.scrollBy({ left: amount * dir, behavior: "smooth" });
    setTimeout(updateScrollState, 350);
  }

  useEffect(() => {
    updateScrollState();
  }, [products.length]);

  return (
    <section className="section-shell mt-12">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="pill mb-3">Our favourites</div>
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            Best in Florals
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Fresh picks from live catalog inventory with real pricing and availability.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => scrollByDir(-1)}
            disabled={!canScroll.left}
            aria-label="Scroll left"
            className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center bg-white/90 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 text-slate-700" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M12.5 15L7.5 10l5-5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => scrollByDir(1)}
            disabled={!canScroll.right}
            aria-label="Scroll right"
            className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center bg-white/90 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 text-slate-700" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <Link href="/products" className="text-olive-green font-medium hover:underline px-2 py-1">
            View all
          </Link>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="relative flex gap-6 snap-x overflow-x-auto pb-2 no-scrollbar"
        role="list"
        aria-label="Best products"
      >
        {loading && Array.from({ length: 5 }).map((_, i) => <ProductSkeleton key={`skeleton-${i}`} />)}

        {!loading && products.map((p) => {
          const rating = Math.round(p.averageRating ?? 5);
          const imageSrc = sanitizeImageUrl(p.image) ?? FALLBACK_IMG;
          return (
            <article
              key={p.id}
              role="listitem"
              className="group snap-start w-[250px] flex-shrink-0 bg-white rounded-2xl shadow-sm border border-olive-green/10 flex flex-col overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link href={`/products/${p.slug}`} className="relative w-full h-56 overflow-hidden">
                <Image
                  src={imageSrc}
                  alt={p.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-[11px] uppercase tracking-wide text-olive-green/70 font-medium">
                  {p.category?.name ?? "Cut Flowers"}
                </p>
                <h3 className="mt-1 font-semibold text-base text-slate-900 line-clamp-1">{p.name}</h3>
                <div className="mt-2 flex items-center" aria-label={`Rated ${rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={`${p.id}-star-${idx}`} filled={idx < rating} />
                  ))}
                </div>
                <div className="mt-2 font-bold text-slate-900 text-lg">{formatINR(p.price)}</div>
                <Link
                  href={`/products/${p.slug}`}
                  className="mt-3 inline-flex items-center justify-center rounded-md bg-olive-green text-white px-3 py-2 text-sm font-medium"
                >
                  View product
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
