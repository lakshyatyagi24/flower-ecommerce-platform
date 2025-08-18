"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product, products as allProducts } from "@/lib/products";

type Props = {
  initialQuery?: string;
  initialProducts?: Product[];
};

export default function SearchResultsClient({ initialQuery = "", initialProducts = [] }: Props) {
  const [query] = useState(initialQuery);
  const [products] = useState<Product[]>(initialProducts);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [occasion, setOccasion] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<string>("relevance");
  const [priceRange, setPriceRange] = useState<[number, number] | undefined>(undefined);

  const filtered = useMemo(() => {
    let out = products;
    if (category) out = out.filter((p) => p.collection === category);
    if (occasion) out = out.filter((p) => p.description?.toLowerCase().includes(occasion.toLowerCase()));
    if (priceRange) {
      const [min, max] = priceRange;
      out = out.filter((p) => {
        const v = parseFloat(p.price.replace(/[\u20b9,]/g, ""));
        return v >= min && v <= max;
      });
    }

    if (sort === "price-asc") out = out.slice().sort((a, b) => parseFloat(a.price.replace(/[\u20b9,]/g, "")) - parseFloat(b.price.replace(/[\u20b9,]/g, "")));
    else if (sort === "price-desc") out = out.slice().sort((a, b) => parseFloat(b.price.replace(/[\u20b9,]/g, "")) - parseFloat(a.price.replace(/[\u20b9,]/g, "")));
    // relevance or newest do nothing in this minimal implementation

    return out;
  }, [products, category, sort, occasion, priceRange]);

  const categories = Array.from(new Set(products.map((p) => p.collection).filter(Boolean))) as string[];

  const recommended = allProducts.slice(0, 4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <aside className="md:col-span-1">
        <div className="bg-white p-4 rounded-md shadow-sm">
          <h3 className="font-semibold mb-2">Filters</h3>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={category ?? ""} onChange={(e) => setCategory(e.target.value || undefined)} className="w-full border rounded p-2">
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Sort</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full border rounded p-2">
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Occasion</label>
            <select value={occasion ?? ""} onChange={(e) => setOccasion(e.target.value || undefined)} className="w-full border rounded p-2">
              <option value="">Any</option>
              <option value="birthday">Birthday</option>
              <option value="wedding">Wedding</option>
              <option value="sympathy">Sympathy</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Price range</label>
            <select value={priceRange ? priceRange.join('-') : ''} onChange={(e) => {
              const v = e.target.value;
              if (!v) setPriceRange(undefined);
              else {
                const [min, max] = v.split('-').map(Number);
                setPriceRange([min, max]);
              }
            }} className="w-full border rounded p-2">
              <option value="">All</option>
              <option value="0-499">Under ₹500</option>
              <option value="500-999">₹500 - ₹999</option>
              <option value="1000-99999">₹1,000+</option>
            </select>
          </div>
        </div>
      </aside>

      <section className="md:col-span-3">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">{filtered.length} results {query ? `for "${query}"` : ''}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-md shadow-sm text-center">
              <h2 className="text-xl font-semibold">No results found</h2>
              <p className="text-sm text-gray-600 mt-2">{"We couldn't find matches for " + (query ? '"' + query + '"' : ' your search') + '.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white p-4 rounded-md shadow-sm">
                <h3 className="font-semibold mb-3">Recommended for you</h3>
                <div className="grid grid-cols-2 gap-3">
                  {recommended.map((p) => (
                    <Link key={p.id} href={`/products/${p.id}`} className="flex items-center gap-x-3 bg-gray-50 p-2 rounded">
                      <div className="w-16 h-16 relative rounded overflow-hidden flex-shrink-0">
                        <Image src={p.img} alt={p.title} fill className="object-cover" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{p.title}</div>
                        <div className="text-xs text-gray-500">{p.price}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-md shadow-sm">
                <h3 className="font-semibold mb-3">Event Services</h3>
                <p className="text-sm text-gray-600 mb-3">Looking for help with weddings, corporate events or parties? Explore our services.</p>
                <Link href="/events" className="inline-block text-olive-green font-medium">View event services</Link>
              </div>
            </div>

            <div className="bg-white p-4 rounded-md shadow-sm">
              <h3 className="font-semibold mb-2">Tips for better search</h3>
              <ul className="list-disc list-inside text-sm text-gray-600">
                <li>Try shorter keywords like <strong>roses</strong> or <strong>birthday</strong></li>
                <li>Try categories like <strong>rustic bouquets</strong> or <strong>autumn-rustic</strong></li>
                <li>Check spelling or try singular/plural forms</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <article key={p.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="relative w-full h-40">
                  <Image src={p.img} alt={p.title} fill className="object-cover" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm">{p.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-bold">{p.price}</span>
                    <button className="text-olive-green font-medium">Add</button>
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
