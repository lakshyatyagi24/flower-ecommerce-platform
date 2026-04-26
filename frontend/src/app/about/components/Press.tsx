"use client";

import React from "react";
import Link from "next/link";

const mentions = [
  {
    title: "Catalog-first commerce rollout",
    source: "Product update",
    quote: "Photo consistency and live stock visibility improved customer confidence across product pages.",
  },
  {
    title: "Event order support improvements",
    source: "Operations note",
    quote: "Bulk inquiry and order-tracking touchpoints reduced support turnaround time.",
  },
  {
    title: "Image reliability hardening",
    source: "Engineering note",
    quote: "URL sanitization and remote image policy updates reduced broken media incidents.",
  },
  {
    title: "Search and discovery upgrade",
    source: "UX update",
    quote: "Live suggestions now prioritize real products and category-based paths.",
  },
  {
    title: "Cross-page content alignment",
    source: "Website audit",
    quote: "Legacy placeholder assets were replaced with current catalog visuals and copy.",
  },
];

export default function Press() {
  return (
    <section aria-labelledby="press" className="mb-12">
      <h2 id="press" className="text-2xl font-semibold text-gray-900 mb-6">
        Press & Updates
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentions.map((p) => (
          <div key={p.title} className="bg-white rounded-lg p-6 border min-h-[170px]">
            <p className="text-xs uppercase tracking-[0.14em] text-olive-green/70">{p.source}</p>
            <h3 className="mt-2 font-semibold text-slate-900">{p.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">"{p.quote}"</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/contact" className="text-sm font-medium text-green-700 hover:underline">
          Contact us for media queries
        </Link>
      </div>
    </section>
  );
}
