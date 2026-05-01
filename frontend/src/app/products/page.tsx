"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiProduct, ApiCategory, api } from "@/lib/api";
import { useCart, formatINR } from "@/lib/cart-context";

function ProductsView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const collection = searchParams?.get("collection") || undefined;
  const category = searchParams?.get("category") || collection || undefined;
  const q = searchParams?.get("q") || undefined;
  const sort = searchParams?.get("sort") || "newest";
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { add } = useCart();

  // Load categories once for the filter chips.
  useEffect(() => {
    let cancelled = false;
    api
      .listCategories()
      .then((res) => {
        if (cancelled) return;
        setCategories(res.filter((c) => c.active !== false));
      })
      .catch(() => {
        /* fail silently — filter chips simply won't render */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const visibleProducts = React.useMemo(() => {
    const list = [...products];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    // "newest" keeps the API order (which is by createdAt desc on the backend)
    return list;
  }, [products, sort]);

  const heading = q
    ? `Results for "${q}"`
    : category
      ? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "All florals";

  function setQuery(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = { category, q, sort, ...next };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  }

  return (
    <main className="section-shell mt-12 mb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="pill mb-3">Curated collections</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">{heading}</h1>
          <p className="text-slate-700 mt-2">
            Premium fresh-cut flowers — roses, orchids, sunflowers, lilies and more — sourced directly from Indian farms.
          </p>
        </div>
        <Link href="/" className="text-olive-green font-semibold underline-offset-4 hover:underline">
          Back to home
        </Link>
      </div>

      {(categories.length > 0 || q) && (
        <div className="mb-8 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setQuery({ category: undefined })}
              className={`text-xs uppercase tracking-wide px-3 py-1.5 rounded-full border transition ${
                !category
                  ? "bg-olive-green text-white border-olive-green"
                  : "bg-white text-olive-green border-olive-green/20 hover:bg-olive-green/5"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setQuery({ category: c.slug })}
                className={`text-xs uppercase tracking-wide px-3 py-1.5 rounded-full border transition ${
                  category === c.slug
                    ? "bg-olive-green text-white border-olive-green"
                    : "bg-white text-olive-green border-olive-green/20 hover:bg-olive-green/5"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="sort" className="text-slate-700">Sort by</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setQuery({ sort: e.target.value })}
              className="rounded-md border-gray-200 text-sm focus:ring-2 focus:ring-olive-green/40"
            >
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        </div>
      )}

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

      {!loading && !error && visibleProducts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-700">No products match this view yet.</p>
          {(category || q) && (
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="mt-4 inline-block text-olive-green font-semibold underline-offset-4 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && !error && visibleProducts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visibleProducts.map((p) => {
            const minQty = p.minOrderQty && p.minOrderQty > 0 ? p.minOrderQty : 1;
            const outOfStock = p.saleMode !== "ENQUIRY" && typeof p.stock === "number" && p.stock <= 0;
            return (
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
                  {p.featured && (
                    <span className="absolute top-2 left-2 pill text-[10px]">Featured</span>
                  )}
                  {p.saleMode === "ENQUIRY" && (
                    <span className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-light-brown text-white">
                      Enquire
                    </span>
                  )}
                </Link>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h3 className="font-semibold text-base sm:text-lg text-slate-900 leading-snug">
                    <Link href={`/products/${p.slug}`} className="hover:text-olive-green">
                      {p.name}
                    </Link>
                  </h3>
                  <div className="text-sm mt-auto">
                    {p.saleMode === "ENQUIRY" ? (
                      <div className="font-semibold text-olive-green">Custom quote</div>
                    ) : (
                      <div className="font-semibold text-olive-green">
                        {formatINR(p.price)}
                        {p.unit && p.unit !== "piece" ? (
                          <span className="ml-1 text-xs font-normal text-olive-green/70">/ {p.unit}</span>
                        ) : null}
                      </div>
                    )}
                    {minQty > 1 ? (
                      <div className="text-xs text-slate-500 mt-1">Minimum {minQty} {p.unit && p.unit !== "piece" ? p.unit : "units"}</div>
                    ) : null}
                  </div>
                  {p.saleMode === "ENQUIRY" ? (
                    <Link
                      href={`/products/${p.slug}`}
                      className="mt-1 inline-flex items-center justify-center w-full bg-olive-green text-white text-sm font-semibold px-4 py-2 rounded-full shadow-sm hover:opacity-95 transition"
                    >
                      Enquire now
                    </Link>
                  ) : outOfStock ? (
                    <button
                      type="button"
                      disabled
                      className="mt-1 inline-flex items-center justify-center w-full bg-slate-100 text-slate-400 text-sm font-semibold px-4 py-2 rounded-full cursor-not-allowed"
                    >
                      Out of stock
                    </button>
                  ) : (
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
                            saleMode: p.saleMode,
                            gstRate: p.gstRate,
                          },
                          minQty,
                        )
                      }
                      className="mt-1 inline-flex items-center justify-center w-full bg-olive-green text-white text-sm font-semibold px-4 py-2 rounded-full shadow-sm hover:opacity-95 transition"
                    >
                      Add to cart
                    </button>
                  )}
                </div>
              </article>
            );
          })}
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
