"use client";

import React from "react";
import Link from "next/link";

export const TrustBarCompact: React.FC = () => {
  return (
    <div className="w-full bg-[#f5ede2] border-t border-b border-olive-green/10 py-2.5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-white/70 flex items-center justify-center text-olive-green text-[10px] font-bold">✓</span>
            <span>Freshness guarantee</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-white/70 flex items-center justify-center text-[10px]">🚚</span>
            <span>Same-day delivery</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-white/70 flex items-center justify-center text-[10px]">↩</span>
            <span>48-hr replacement guarantee</span>
          </div>
        </div>
        <div className="text-xs text-slate-600">
          <Link href="/contact" className="underline hover:text-olive-green transition-colors">View policies</Link>
        </div>
      </div>
    </div>
  );
};

const trustItems = [
  {
    icon: "🌸",
    title: "Freshness Guarantee",
    desc: "Farm-fresh blooms dispatched within 24–48 hrs of harvest — vibrant, fragrant, and long-lasting.",
  },
  {
    icon: "🚚",
    title: "Same-Day Delivery",
    desc: "Order before 3 PM for same-day delivery across 8+ major Indian cities.",
  },
  {
    icon: "↩",
    title: "Easy Replacement",
    desc: "Flowers arrived damaged? Contact us within 48 hours for a free replacement or full refund.",
  },
  {
    icon: "🔒",
    title: "Secure Checkout",
    desc: "SSL-encrypted payments with trusted Indian payment gateways — UPI, cards, net banking.",
  },
];

const TrustBar: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-r from-[#f8f1e8] via-[#f3e7da] to-[#f8f1e8] border-t border-b border-olive-green/10 py-10">
      <div className="section-shell">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {trustItems.map((item) => (
              <div key={item.title} className="flex items-start gap-3 section-card bg-white/85 shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                <div className="w-10 h-10 rounded-full bg-[#f1e4d4] flex items-center justify-center flex-shrink-0 text-base">{item.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs text-slate-600 md:pl-4">
            <Link href="/contact" className="text-olive-green font-semibold underline-offset-4 hover:underline">Read policies</Link>
            <div className="text-slate-400 hidden sm:block">|</div>
            <div>Delivery coverage varies by PIN code.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
