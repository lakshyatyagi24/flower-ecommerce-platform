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
    <div className="w-full bg-gradient-to-r from-[#f8f1e8] via-[#f3e7da] to-[#f8f1e8] border-t border-b border-olive-green/10 py-10">
      <div className="section-shell">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[{
              icon:'✓',title:'Freshness Guarantee',desc:'Farm‑fresh blooms, delivered vibrant.'},
              {icon:'🚚',title:'Delivery Coverage',desc:'Same-day or next-day in select cities.'},
              {icon:'↩',title:'Returns & Refunds',desc:'Easy returns within 48 hours for damage.'},
              {icon:'🔒',title:'Secure Checkout',desc:'Encrypted payments and trusted gateways.'}].map((item) => (
              <div key={item.title} className="flex items-start gap-3 section-card bg-white/80 shadow-sm p-3">
                <div className="w-10 h-10 rounded-full bg-[#f1e4d4] flex items-center justify-center text-olive-green font-semibold">{item.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-600">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs text-slate-600">
            <Link href="#" className="text-olive-green font-semibold underline-offset-4 hover:underline">Read policies</Link>
            <div>Coverage varies by pin code — check at checkout.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
