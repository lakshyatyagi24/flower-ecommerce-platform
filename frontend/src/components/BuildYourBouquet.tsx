"use client";

import React from "react";
import Link from "next/link";

export default function BuildYourBouquet() {
  return (
    <section className="section-shell mt-12">
      <div className="section-card p-6 sm:p-8 flex flex-col md:flex-row items-start gap-6 bg-gradient-to-br from-[#f8f1e8] via-white to-[#efe0d2]">
        <div className="flex-1">
          <div className="pill mb-3">Custom atelier</div>
          <h3 className="text-2xl md:text-3xl font-semibold text-slate-900">Build-Your-Bouquet</h3>
          <p className="mt-2 text-sm text-slate-600 max-w-xl">Create a custom bouquet in minutes — choose size, palette, and finishing add-ons for a truly artisan result.</p>

          {/* 3-step preview */}
          <div className="mt-4 grid grid-cols-3 gap-3 items-center">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#4a3b2a] text-white flex items-center justify-center font-semibold">1</div>
              <div className="mt-2 text-sm font-medium text-slate-700">Size</div>
              <div className="mt-1 text-xs text-slate-500">Small / Medium / Large</div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-rose-300 text-white flex items-center justify-center font-semibold">2</div>
              <div className="mt-2 text-sm font-medium text-slate-700">Palette</div>
              <div className="mt-1 text-xs text-slate-500">Warm, Pastel, Seasonal</div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#846953] text-white flex items-center justify-center font-semibold">3</div>
              <div className="mt-2 text-sm font-medium text-slate-700">Add‑ons</div>
              <div className="mt-1 text-xs text-slate-500">Card, Wrap, Vase</div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <Link href="/build" className="inline-flex items-center justify-center rounded-full bg-olive-green px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition focus:outline-none focus:ring-2 focus:ring-olive-green/30">Start customizing</Link>

            <div className="text-xs uppercase tracking-[0.16em] text-olive-green/70">
              <div>Lead time: <span className="font-semibold text-slate-800">2–4 business days</span></div>
              <div className="mt-1">Prices from <span className="font-semibold text-slate-800">₹1,299</span></div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-64 flex-shrink-0">
          <div className="rounded-2xl overflow-hidden shadow-[0_18px_40px_rgba(24,20,13,0.12)] bg-white/80 border border-white/60 p-4 relative">
            <div className="h-40 w-full rounded-xl bg-gradient-to-br from-[#f1e4d4] via-white to-[#e8d9c8] border border-white/50 flex items-center justify-center text-slate-600 text-xs">Preview: artisan bouquet mockup</div>
            <div className="mt-3 text-xs text-slate-600">See how size, palette, and add-ons come together. Full configurator opens on click.</div>
            <span className="absolute top-4 right-4 px-2 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] bg-black/5 text-olive-green/80">Luxe</span>
          </div>
        </div>
      </div>

      {/* Add-Ons & Gift Enhancers band (mid-page) */}
      <div className="mt-8 w-full section-card p-6 bg-white/90">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="pill mb-3">Gift enhancers</div>
            <h3 className="text-2xl font-semibold text-slate-900">Add-Ons & Gift Enhancers</h3>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">Vases, handwritten notes, chocolates, or candles crafted to match our Magnolia-inspired vibe.</p>
          </div>

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-olive-green/70">
            <span>Bundle & save</span>
            <span className="px-2 py-1 rounded-full bg-[#f1e4d4] text-olive-green">2+ add-ons</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="flex items-center gap-3 p-3 section-card shadow-sm bg-white/95">
            <div className="w-16 h-16 rounded-md bg-[#f1e4d4] flex-shrink-0 flex items-center justify-center text-slate-700 text-xs">Vase</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900">Rustic Ceramic Vase</div>
              <div className="text-xs text-slate-600">Hand-glazed, fits medium bouquets</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-sm font-semibold text-olive-green">₹499</div>
              <button className="inline-flex items-center justify-center rounded-full bg-olive-green px-3 py-1.5 text-[11px] font-semibold text-white hover:shadow-md">+ Add</button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex items-center gap-3 p-3 section-card shadow-sm bg-white/95">
            <div className="w-16 h-16 rounded-md bg-[#f7eddc] flex-shrink-0 flex items-center justify-center text-slate-700 text-xs">Note</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900">Handwritten Note</div>
              <div className="text-xs text-slate-600">Personal message on textured card</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-sm font-semibold text-olive-green">₹199</div>
              <button className="inline-flex items-center justify-center rounded-full bg-olive-green px-3 py-1.5 text-[11px] font-semibold text-white hover:shadow-md">+ Add</button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex items-center gap-3 p-3 section-card shadow-sm bg-white/95">
            <div className="w-16 h-16 rounded-md bg-[#f7e4cf] flex-shrink-0 flex items-center justify-center text-slate-700 text-xs">Choc</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900">Artisan Chocolates</div>
              <div className="text-xs text-slate-600">Small box of handpicked truffles</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-sm font-semibold text-olive-green">₹299</div>
              <button className="inline-flex items-center justify-center rounded-full bg-olive-green px-3 py-1.5 text-[11px] font-semibold text-white hover:shadow-md">+ Add</button>
            </div>
          </div>

          {/* Card 4 */}
          <div className="flex items-center gap-3 p-3 section-card shadow-sm bg-white/95">
            <div className="w-16 h-16 rounded-md bg-[#e8f0f5] flex-shrink-0 flex items-center justify-center text-slate-700 text-xs">Cndl</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900">Scented Candle</div>
              <div className="text-xs text-slate-600">Soy candle — soft floral notes</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-sm font-semibold text-olive-green">₹249</div>
              <button className="inline-flex items-center justify-center rounded-full bg-olive-green px-3 py-1.5 text-[11px] font-semibold text-white hover:shadow-md">+ Add</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
