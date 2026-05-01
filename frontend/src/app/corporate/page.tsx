"use client";

import React from "react";
import Link from "next/link";
import EnquiryForm from "@/components/EnquiryForm";

export default function CorporatePage() {
  return (
    <main className="section-shell mt-12 mb-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <p className="pill mb-3">For business</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight">
            Corporate florals, on demand.
          </h1>
          <p className="mt-3 text-slate-700 leading-relaxed">
            We supply farm-fresh cut flowers and custom bouquets to offices, conferences, hotels and event teams across Delhi NCR.
            Send us your requirement — quantity, occasion, delivery date — and we&apos;ll come back with a quote within a few hours.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-olive-green/15 bg-white/70 p-4">
              <p className="font-semibold text-olive-green">Bulk cut flowers</p>
              <p className="mt-1 text-slate-600">Roses, lilies, orchids, carnations, sunflowers — sourced fresh from the mandi every morning.</p>
            </div>
            <div className="rounded-2xl border border-olive-green/15 bg-white/70 p-4">
              <p className="font-semibold text-olive-green">Custom bouquets</p>
              <p className="mt-1 text-slate-600">Hand-tied corporate bouquets for VIP gifting, conferences and award ceremonies.</p>
            </div>
            <div className="rounded-2xl border border-olive-green/15 bg-white/70 p-4">
              <p className="font-semibold text-olive-green">Event arrangements</p>
              <p className="mt-1 text-slate-600">Centerpieces, stage florals and reception arrangements for offsites and celebrations.</p>
            </div>
            <div className="rounded-2xl border border-olive-green/15 bg-white/70 p-4">
              <p className="font-semibold text-olive-green">Reliable delivery</p>
              <p className="mt-1 text-slate-600">Cab delivery for large orders. We coordinate timing with your event team.</p>
            </div>
          </div>

          <p className="mt-8 text-sm text-slate-600">
            Looking for one-off cut flowers instead?{" "}
            <Link href="/products?category=cut-flowers" className="text-olive-green font-semibold underline-offset-4 hover:underline">
              Shop the cut-flower catalogue →
            </Link>
          </p>
        </div>

        <div>
          <EnquiryForm
            heading="Tell us about your requirement"
            description="We respond to every enquiry within a few hours during business hours."
            source="corporate"
            occasion="Corporate / Office"
            submitLabel="Request a quote"
          />
        </div>
      </div>
    </main>
  );
}
