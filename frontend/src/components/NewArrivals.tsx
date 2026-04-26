"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ApiProduct, api, formatINR, sanitizeImageUrl } from "@/lib/api";

const FALLBACK_IMG =
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5528.jpg?v=1709440820";

function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-olive-green/10 bg-white animate-pulse">
      <div className="aspect-[4/5] bg-slate-100" />
      <div className="p-4">
        <div className="h-3 w-24 bg-slate-100 rounded" />
        <div className="h-5 w-40 bg-slate-100 rounded mt-2" />
        <div className="h-4 w-20 bg-slate-100 rounded mt-3" />
      </div>
    </div>
  );
}

export default function NewArrivals() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await api.listProducts({ active: true, take: 8 });
        if (!cancelled) setProducts(data.items);
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

  return (
    <section className="section-shell mt-12">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="pill mb-3">Just synced</div>
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            New Arrivals
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Latest floral picks mapped from current source content.
          </p>
        </div>
        <Link href="/products" className="text-olive-green font-medium hover:underline">
          Browse all products
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
        {loading && Array.from({ length: 8 }).map((_, idx) => <CardSkeleton key={`arrive-skeleton-${idx}`} />)}

        {!loading && products.map((p) => {
          const imageSrc = sanitizeImageUrl(p.image) ?? FALLBACK_IMG;
          return (
            <article
              key={p.id}
              className="group rounded-2xl overflow-hidden border border-olive-green/10 bg-white shadow-sm hover:shadow-lg transition-shadow"
            >
              <Link href={`/products/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden">
                <Image
                  src={imageSrc}
                  alt={p.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>

              <div className="p-4">
                <p className="text-[11px] uppercase tracking-wide text-olive-green/70 font-medium line-clamp-1">
                  {p.category?.name ?? "Cut Flowers"}
                </p>
                <h3 className="mt-1 text-base font-semibold text-slate-900 line-clamp-1">{p.name}</h3>
                <div className="mt-2 text-lg font-bold text-slate-900">{formatINR(p.price)}</div>
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
