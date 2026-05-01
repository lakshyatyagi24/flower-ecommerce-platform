"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ApiProduct, api } from "@/lib/api";
import { formatINR } from "@/lib/cart-context";

type Props = {
  /** ID of the product currently being viewed — excluded from related results. */
  currentProductId: number;
  /** Slug of the parent category. If absent we fall back to the latest products. */
  categorySlug?: string | null;
  /** Maximum number of cards to show. Defaults to 4. */
  limit?: number;
  /** Heading copy override. */
  heading?: string;
};

const RelatedProducts: React.FC<Props> = ({
  currentProductId,
  categorySlug,
  limit = 4,
  heading = "You may also love",
}) => {
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Pull a few extra so we can filter out the current product without ending up short.
    const take = limit + 4;
    api
      .listProducts({ category: categorySlug || undefined, take })
      .then((res) => {
        if (cancelled) return;
        const filtered = res.items.filter((p) => p.id !== currentProductId).slice(0, limit);
        setItems(filtered);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentProductId, categorySlug, limit]);

  if (!loading && items.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="pill mb-2">More to explore</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">{heading}</h2>
        </div>
        <Link href="/products" className="text-olive-green font-semibold underline-offset-4 hover:underline text-sm">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="section-card overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {items.map((p) => (
            <article key={p.id} className="section-card overflow-hidden group flex flex-col">
              <Link href={`/products/${p.slug}`} className="relative w-full h-48 bg-slate-100 block">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🌸</div>
                )}
              </Link>
              <div className="p-4 flex flex-col gap-1">
                <h3 className="font-semibold text-base text-slate-900 leading-snug">
                  <Link href={`/products/${p.slug}`} className="hover:text-olive-green">
                    {p.name}
                  </Link>
                </h3>
                <div className="text-sm font-semibold text-olive-green">
                  {p.saleMode === "ENQUIRY" ? "Custom quote" : formatINR(p.price)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default RelatedProducts;
