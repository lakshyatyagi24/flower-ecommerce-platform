"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ApiProduct, api, formatINR, sanitizeImageUrl } from "@/lib/api";

const FALLBACK_BANNER =
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5577.jpg?v=1709440942";
const FALLBACK_CARD =
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5536.jpg?v=1709440820";

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-olive-green/10 overflow-hidden bg-white animate-pulse">
      <div className="h-28 sm:h-32 bg-slate-100" />
      <div className="p-4">
        <div className="h-4 w-24 bg-slate-100 rounded" />
        <div className="h-4 w-16 bg-slate-100 rounded mt-2" />
      </div>
    </div>
  );
}

export default function SeasonalCollection() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const inCutFlowers = await api.listProducts({
          category: "cut-flowers",
          active: true,
          take: 6,
        });

        if (!cancelled && inCutFlowers.items.length > 0) {
          setProducts(inCutFlowers.items);
          return;
        }

        const fallback = await api.listProducts({ active: true, take: 6 });
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

  const bannerProduct = useMemo(() => products[0], [products]);
  const cards = useMemo(() => products.slice(1, 7), [products]);

  return (
    <section className="section-shell mt-12">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="pill mb-3">Seasonal curation</div>
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            Seasonal Flower Edit
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            A rotating selection inspired by current inventory and real market-ready stems.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Link
            href="/products?category=cut-flowers"
            className="text-olive-green font-semibold underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded px-2 py-1"
          >
            Explore all
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 rounded-[22px] overflow-hidden shadow-[0_28px_70px_rgba(24,20,13,0.12)] relative min-h-[340px]">
          <Image
            src={sanitizeImageUrl(bannerProduct?.image) ?? FALLBACK_BANNER}
            alt={bannerProduct?.name ?? "Seasonal flower collection"}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-black/30 to-black/45" />

          <div className="relative z-10 p-8 lg:p-12 flex flex-col h-full justify-end text-white">
            <p className="pill w-fit mb-3 bg-white/90 text-slate-900 border-white/40">Seasonal edit</p>
            <h3 className="text-3xl font-semibold line-clamp-2">
              {bannerProduct?.name ?? "Hand-picked seasonal favorites"}
            </h3>
            <p className="mt-2 text-sm text-white/90 max-w-lg line-clamp-3">
              {bannerProduct?.description ??
                "Freshly curated stems chosen for texture, tone and long vase life."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 items-center">
              <Link
                href={bannerProduct ? `/products/${bannerProduct.slug}` : "/products?category=cut-flowers"}
                className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition"
              >
                Shop this pick
              </Link>
              <span className="text-xs uppercase tracking-[0.16em] text-white/80">
                Same-day delivery in key cities
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-2 gap-4">
          {loading && Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={`seasonal-skeleton-${i}`} />)}

          {!loading && cards.map((p) => (
            <article
              key={p.id}
              className="section-card overflow-hidden flex flex-col group border border-olive-green/10"
            >
              <div className="relative w-full h-28 sm:h-32">
                <Image
                  src={sanitizeImageUrl(p.image) ?? FALLBACK_CARD}
                  alt={p.name}
                  fill
                  className="object-cover transition duration-400 group-hover:scale-105"
                />
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[10px] text-white/90 opacity-0 group-hover:opacity-100 transition">
                  <span className="px-2 py-1 rounded-full bg-black/35">Farm fresh</span>
                  <span className="px-2 py-1 rounded-full bg-black/35">Gift ready</span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm text-slate-900 line-clamp-2">{p.name}</h4>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="font-bold text-olive-green">{formatINR(p.price)}</span>
                  <Link href={`/products/${p.slug}`} className="text-olive-green text-sm font-medium hover:underline">
                    View
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
