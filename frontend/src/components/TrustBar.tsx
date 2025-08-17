"use client";

import React from "react";
import Link from "next/link";

export const TrustBarCompact: React.FC = () => {
  return (
    <div className="w-full bg-olive-50 border-t border-b border-olive-100 py-3">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-olive-700 text-[10px]">✓</span>
            <span>Freshness guarantee</span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-olive-700 text-[10px]">🚚</span>
            <span>Delivery across major cities</span>
          </div>
        </div>

        <div className="text-xs text-slate-600">
          <Link href="#" className="underline">View policies</Link>
        </div>
      </div>
    </div>
  );
};

const TrustBar: React.FC = () => {
  return (
    <div className="w-full bg-white border-t border-b border-slate-100 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-rose-50 flex items-center justify-center text-rose-600">✓</div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Freshness Guarantee</div>
                <div className="text-xs text-slate-500">Farm‑fresh blooms, guaranteed to arrive vibrant.</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center text-amber-600">🚚</div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Delivery Coverage</div>
                <div className="text-xs text-slate-500">Same-day or next-day in selected cities.</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-sky-50 flex items-center justify-center text-sky-600">↩</div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Returns & Refunds</div>
                <div className="text-xs text-slate-500">Easy returns within 48 hours for damaged items.</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-olive-50 flex items-center justify-center text-olive-700">🔒</div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Secure Checkout</div>
                <div className="text-xs text-slate-500">Encrypted payments and trusted gateways.</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link href="#" className="text-sm text-olive-700 font-medium underline">Read policies</Link>
            <div className="text-xs text-slate-500">Delivery coverage may vary by pin code — check at checkout.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
