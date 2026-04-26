"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiProduct, api } from "@/lib/api";
import { useCart, formatINR } from "@/lib/cart-context";

function ProductsView() {
  const searchParams = useSearchParams();
  const collection = searchParams?.get("collection") || undefined;
  const category = searchParams?.get("category") || collection || undefined;
  const q = searchParams?.get("q") || undefined;
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { add } = useCart();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listProducts({ category, q, take: 60 })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.items);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || "Failed to load products");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, q]);

  const heading = q
    ? `Results for "${q}"`
    : category
      ? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "All florals";

  return (
    <main className="section-shell mt-12 mb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="pill mb-3">Curated collections</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">{heading}</h1>
          <p className="text-slate-700 mt-2">
            Lush palettes, artisanal wrapping, and indulgent gifting inspired by Magnolia Lane.
          </p>
        </div>
        <Link href="/" className="text-olive-green font-semibold underline-offset-4 hover:underline">
          Back to home
        </Link>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="section-card overflow-hidden animate-pulse">
              <div className="w-full h-48 sm:h-56 bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-16">
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-slate-600 mt-2">
            Make sure the backend is running and reachable at the configured API URL.
          </p>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-700">No products match this view yet.</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <article key={p.id} className="section-card overflow-hidden group flex flex-col">
              <Link href={`/products/${p.slug}`} className="relative w-full h-48 sm:h-56 bg-slate-100 block">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🌸</div>
                )}
              </Link>
              <div className="p-4 flex flex-col gap-2 flex-1">
                {p.featured && (
                  <span className="text-[12px] uppercase tracking-[0.14em] text-olive-green/70">Featured</span>
                )}
                <h3 className="font-semibold text-lg text-slate-900">
                  <Link href={`/products/${p.slug}`} className="hover:text-olive-green">
                    {p.name}
                  </Link>
                </h3>
                <div className="flex items-center justify-between text-sm text-slate-700 mt-auto">
                  <span className="font-semibold text-olive-green">{formatINR(p.price)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      add(
                        {
                          productId: p.id,
                          slug: p.slug,
                          name: p.name,
                          price: p.price,
                          image: p.image,
                        },
                        1,
                      )
                    }
                    className="text-olive-green font-medium hover:underline"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="section-shell mt-12 mb-16">Loading…</div>}>
      <ProductsView />
    </Suspense>
  );
}
