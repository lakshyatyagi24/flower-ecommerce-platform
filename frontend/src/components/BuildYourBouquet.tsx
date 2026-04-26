"use client";

import React from "react";
import Link from "next/link";

const addOns = [
  {
    label: "Vase",
    name: "Rustic Ceramic Vase",
    desc: "Hand-glazed, fits medium bouquets",
    price: "₹499",
    bg: "bg-[#f1e4d4]",
  },
  {
    label: "Note",
    name: "Handwritten Message",
    desc: "Personal note on premium textured card",
    price: "₹99",
    bg: "bg-[#f7eddc]",
  },
  {
    label: "Choc",
    name: "Artisan Chocolates",
    desc: "Handpicked selection of assorted truffles",
    price: "₹349",
    bg: "bg-[#f7e4cf]",
  },
  {
    label: "Cndl",
    name: "Scented Candle",
    desc: "Soy candle with soft floral notes",
    price: "₹299",
    bg: "bg-[#e8f0f5]",
  },
];

export default function BuildYourBouquet() {
  return (
    <section className="section-shell mt-12">
      <div className="section-card p-6 sm:p-8 flex flex-col md:flex-row items-start gap-8 bg-gradient-to-br from-[#f8f1e8] via-white to-[#efe0d2]">
        <div className="flex-1">
          <div className="pill mb-3">Customise your order</div>
          <h3 className="text-2xl md:text-3xl font-semibold text-slate-900">Build-Your-Bouquet</h3>
          <p className="mt-2 text-sm text-slate-600 max-w-xl">
            Choose your flowers, palette, and add-ons to create a truly personal gift — starting from ₹950.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-4 items-start">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#4a3b2a] text-white flex items-center justify-center font-bold text-sm">1</div>
              <div className="text-sm font-semibold text-slate-800">Choose stems</div>
              <div className="text-xs text-slate-500">Roses, lilies, orchids, sunflowers & more</div>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-rose-300 text-white flex items-center justify-center font-bold text-sm">2</div>
              <div className="text-sm font-semibold text-slate-800">Pick a palette</div>
              <div className="text-xs text-slate-500">Blush, bold, pastel, or seasonal</div>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#846953] text-white flex items-center justify-center font-bold text-sm">3</div>
              <div className="text-sm font-semibold text-slate-800">Add extras</div>
              <div className="text-xs text-slate-500">Vase, card, chocolates, candle</div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-olive-green px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition focus:outline-none focus:ring-2 focus:ring-olive-green/30"
            >
              Start customizing
            </Link>
            <div className="text-xs text-slate-500">
              <span>From <span className="font-semibold text-slate-800">₹950</span></span>
              <span className="mx-2 text-slate-300">·</span>
              <span>Same-day available</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-64 flex-shrink-0">
          <div className="rounded-2xl overflow-hidden shadow-[0_18px_40px_rgba(24,20,13,0.12)] bg-white/80 border border-white/60 p-4 relative">
            <div className="h-40 w-full rounded-xl overflow-hidden bg-gradient-to-br from-[#f8f1e8] via-[#f1dfc9] to-[#e8d4bb] flex flex-col items-center justify-center gap-2 border border-white/50">
              <div className="text-3xl">💐</div>
              <div className="text-xs text-slate-600 font-medium text-center px-3">
                Your custom bouquet preview appears here
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 leading-relaxed">
              Select flowers, palette and add-ons to see your bouquet take shape.
            </div>
            <span className="absolute top-4 right-4 px-2 py-1 rounded-full text-[10px] uppercase tracking-[0.14em] bg-[#f1e4d4] text-olive-green/80 font-semibold">Personal</span>
          </div>
        </div>
      </div>

      <div className="mt-6 section-card p-6 bg-white/90">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="pill mb-3">Gift enhancers</div>
            <h3 className="text-xl font-semibold text-slate-900">Add-Ons & Gift Extras</h3>
            <p className="mt-1 text-sm text-slate-600 max-w-xl">
              Complete the gift with a handwritten note, artisan chocolates, a vase, or a scented candle.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-olive-green/70 uppercase tracking-[0.14em]">
            <span>Bundle &amp; save on</span>
            <span className="px-2 py-1 rounded-full bg-[#f1e4d4] text-olive-green font-semibold">2+ add-ons</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {addOns.map((item) => (
            <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
              <div className={`w-14 h-14 rounded-lg ${item.bg} flex-shrink-0 flex items-center justify-center text-slate-600 text-xs font-semibold`}>
                {item.label}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{item.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                <div className="text-sm font-bold text-olive-green mt-1">{item.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
