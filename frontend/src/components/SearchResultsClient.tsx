"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ApiProduct, formatINR, sanitizeImageUrl } from "@/lib/api";

type Props = {
  initialQuery?: string;
  initialProducts?: ApiProduct[];
  recommendedProducts?: ApiProduct[];
};

const FALLBACK_IMG =
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5536.jpg?v=1709440820";

export default function SearchResultsClient({
  initialQuery = "",
  initialProducts = [],
  recommendedProducts = [],
}: Props) {
  const [query] = useState(initialQuery);
  const [products] = useState<ApiProduct[]>(initialProducts);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<string>("relevance");
  const [priceRange, setPriceRange] = useState<[number, number] | undefined>(undefined);

  const filtered = useMemo(() => {
    let out = products.slice();

    if (category) out = out.filter((p) => p.category?.slug === category);

    if (priceRange) {
      const [min, max] = priceRange;
      out = out.filter((p) => p.price >= min && p.price <= max);
    }

    if (sort === "price-asc") out.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") out.sort((a, b) => b.price - a.price);
    else if (sort === "top-rated") out.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
    else if (sort === "newest") out.sort((a, b) => b.id - a.id);

    return out;
  }, [products, category, sort, priceRange]);

  const categories = Array.from(
    new Map(
      products
        .filter((p) => p.category?.slug)
        .map((p) => [p.category!.slug, { slug: p.category!.slug, name: p.category!.name }]),
    ).values(),
  );

  const recommended = (recommendedProducts.length > 0 ? recommendedProducts : products).slice(0, 4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <aside className="md:col-span-1">
        <div className="bg-white p-4 rounded-md shadow-sm border border-olive-green/10">
          <h3 className="font-semibold mb-2">Filters</h3>

          <label className="block text-sm font-medium mb-1" htmlFor="search-filter-category">
            Category
          </label>
          <select
            id="search-filter-category"
            value={category ?? ""}
            onChange={(e) => setCategory(e.target.value || undefined)}
            className="w-full border rounded p-2 mb-3"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-1" htmlFor="search-filter-sort">
            Sort
          </label>
          <select
            id="search-filter-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full border rounded p-2 mb-3"
          >
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="top-rated">Top Rated</option>
            <option value="newest">Newest</option>
          </select>

          <label className="block text-sm font-medium mb-1" htmlFor="search-filter-price">
            Price range
          </label>
          <select
            id="search-filter-price"
            value={priceRange ? priceRange.join("-") : ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) setPriceRange(undefined);
              else {
                const [min, max] = v.split("-").map(Number);
                setPriceRange([min, max]);
              }
            }}
            className="w-full border rounded p-2"
          >
            <option value="">All</option>
            <option value="0-499">Under ₹500</option>
            <option value="500-999">₹500 - ₹999</option>
            <option value="1000-99999">₹1,000+</option>
          </select>
        </div>
      </aside>

      <section className="md:col-span-3">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {filtered.length} results {query ? `for "${query}"` : ""}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-md shadow-sm text-center border border-olive-green/10">
              <h2 className="text-xl font-semibold">No results found</h2>
              <p className="text-sm text-gray-600 mt-2">
                {`We couldn't find matches for ${query ? `"${query}"` : "your search"}.`}
              </p>
            </div>

            {recommended.length > 0 && (
              <div className="bg-white p-4 rounded-md shadow-sm border border-olive-green/10">
                <h3 className="font-semibold mb-3">Recommended for you</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommended.map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.slug}`}
                      className="flex items-center gap-x-3 bg-gray-50 p-2 rounded"
                    >
                      <div className="w-16 h-16 relative rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={sanitizeImageUrl(p.image) ?? FALLBACK_IMG}
                          alt={p.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                        <div className="text-xs text-gray-500">{formatINR(p.price)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <article key={p.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <Link href={`/products/${p.slug}`} className="relative block w-full h-40">
                  <Image
                    src={sanitizeImageUrl(p.image) ?? FALLBACK_IMG}
                    alt={p.name}
                    fill
                    className="object-cover"
                  />
                </Link>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-1">{p.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {p.description?.replace(/<[^>]+>/g, " ")}
                  </p>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="font-bold">{formatINR(p.price)}</span>
                    <Link href={`/products/${p.slug}`} className="text-olive-green font-medium">
                      View
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
