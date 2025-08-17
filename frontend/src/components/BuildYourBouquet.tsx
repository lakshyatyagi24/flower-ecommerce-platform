"use client";

import React from "react";
import Link from "next/link";

export default function BuildYourBouquet() {
  return (
    <section className="w-full max-w-6xl mx-auto mt-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start gap-6">
        <div className="flex-1">
          <h3 className="text-2xl font-extrabold text-slate-900">Build-Your-Bouquet</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-xl">Create a custom bouquet in minutes — choose size, color palette and finishing add-ons for a truly artisan result. Perfect for gifting or special moments.</p>

          {/* 3-step preview */}
          <div className="mt-4 grid grid-cols-3 gap-3 items-center">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-olive-green text-white flex items-center justify-center font-semibold">1</div>
              <div className="mt-2 text-sm font-medium text-slate-700">Size</div>
              <div className="mt-1 text-xs text-slate-500">Small / Medium / Large</div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-rose-400 text-white flex items-center justify-center font-semibold">2</div>
              <div className="mt-2 text-sm font-medium text-slate-700">Palette</div>
              <div className="mt-1 text-xs text-slate-500">Warm, Pastel, Seasonal</div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-sky-400 text-white flex items-center justify-center font-semibold">3</div>
              <div className="mt-2 text-sm font-medium text-slate-700">Add‑ons</div>
              <div className="mt-1 text-xs text-slate-500">Card, Wrap, Vase</div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Link href="/build" className="inline-flex items-center justify-center rounded-md bg-olive-green px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-olive-green/90 focus:outline-none focus:ring-2 focus:ring-olive-green/30">Start customizing</Link>

            <div className="text-xs text-slate-500">
              <div>Lead time: <span className="font-medium text-slate-700">2–4 business days</span></div>
              <div className="mt-1">Prices from <span className="font-medium text-slate-700">₹1,299</span></div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-56 flex-shrink-0">
          <div className="rounded-lg overflow-hidden shadow-sm bg-gradient-to-tr from-rose-50 to-sky-50 p-3">
            <div className="h-36 w-full rounded-md bg-white/60 border border-white/30 flex items-center justify-center text-slate-600 text-xs">Preview: artisan bouquet mockup</div>
            <div className="mt-3 text-xs text-slate-500">A simple preview to show how choices affect the final bouquet — full configurator opens on click.</div>
          </div>
        </div>
      </div>

      {/* Add-Ons & Gift Enhancers band (mid-page) */}
      <div className="mt-8 w-full bg-slate-50 rounded-2xl border border-slate-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-2xl font-extrabold text-slate-900">Add-Ons & Gift Enhancers</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-2xl">Boost AOV with tasteful extras—vases, handwritten notes, chocolates, or candles crafted to match our rustic vibe. Quick add to any bouquet for a thoughtful finishing touch.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-600">Bundle & save</div>
              <div className="text-xs text-slate-500">Combine 2+ add-ons for a discount</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 rounded-md bg-rose-50 flex-shrink-0 flex items-center justify-center text-slate-600 text-xs">Vase</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">Rustic Ceramic Vase</div>
                <div className="text-xs text-slate-500">Hand-glazed, fits medium bouquets</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm font-semibold text-slate-800">₹499</div>
                <button className="inline-flex items-center justify-center rounded-md bg-olive-green px-3 py-1 text-xs font-medium text-white hover:bg-olive-green/90">+ Add</button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 rounded-md bg-amber-50 flex-shrink-0 flex items-center justify-center text-slate-600 text-xs">Note</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">Handwritten Note</div>
                <div className="text-xs text-slate-500">Personal message on textured card</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm font-semibold text-slate-800">₹199</div>
                <button className="inline-flex items-center justify-center rounded-md bg-olive-green px-3 py-1 text-xs font-medium text-white hover:bg-olive-green/90">+ Add</button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 rounded-md bg-amber-100 flex-shrink-0 flex items-center justify-center text-slate-600 text-xs">Choc</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">Artisan Chocolates</div>
                <div className="text-xs text-slate-500">Small box of handpicked truffles</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm font-semibold text-slate-800">₹299</div>
                <button className="inline-flex items-center justify-center rounded-md bg-olive-green px-3 py-1 text-xs font-medium text-white hover:bg-olive-green/90">+ Add</button>
              </div>
            </div>

            {/* Card 4 */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 rounded-md bg-sky-50 flex-shrink-0 flex items-center justify-center text-slate-600 text-xs">Cndl</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">Scented Candle</div>
                <div className="text-xs text-slate-500">Soy candle — soft floral notes</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm font-semibold text-slate-800">₹249</div>
                <button className="inline-flex items-center justify-center rounded-md bg-olive-green px-3 py-1 text-xs font-medium text-white hover:bg-olive-green/90">+ Add</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
