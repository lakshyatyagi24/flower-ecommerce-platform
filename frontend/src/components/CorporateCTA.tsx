"use client";

import Link from "next/link";

export default function CorporateCTA() {
  return (
    <section className="section-shell mt-12">
      <div className="rounded-3xl bg-gradient-to-br from-olive-green to-olive-green/85 text-white px-6 sm:px-10 py-10 sm:py-14 shadow-[0_28px_70px_rgba(24,20,13,0.18)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/70">For business</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-semibold leading-tight">
              Bulk cut flowers & corporate bouquets
            </h2>
            <p className="mt-3 text-white/85 leading-relaxed max-w-xl">
              Office gifting, conference florals, event arrangements — sourced fresh and delivered on time.
              Tell us what you need and we&apos;ll come back with a custom quote.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
            <Link
              href="/corporate"
              className="inline-flex items-center justify-center rounded-full bg-white text-olive-green px-6 py-3 text-sm font-semibold shadow hover:-translate-y-0.5 transition"
            >
              Request a quote
            </Link>
            <Link
              href="/products?category=cut-flowers"
              className="inline-flex items-center justify-center rounded-full border border-white/40 text-white px-6 py-3 text-sm font-semibold hover:bg-white/10 transition"
            >
              Browse cut flowers
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
