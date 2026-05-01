"use client";

import React from "react";
import Link from "next/link";
import { useSettings } from "@/lib/settings-context";

// Default icons cycle through these as we render whatever USPs the admin has saved.
// Keeping them inline so admins don't need to upload icons — copy is the bit that matters.
const ICONS = ["🌸", "🚚", "↩", "🎁", "🔒", "✨"];

export const TrustBarCompact: React.FC = () => {
  const { usps } = useSettings();
  const visible = usps.slice(0, 3);
  return (
    <div className="w-full bg-[#f5ede2] border-t border-b border-olive-green/10 py-2.5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 text-xs text-slate-700">
          {visible.map((u, i) => (
            <div
              key={u.title + i}
              className={`${i === 0 ? "" : i === 1 ? "hidden sm:flex" : "hidden md:flex"} items-center gap-2`}
            >
              <span className="w-5 h-5 rounded-full bg-white/70 flex items-center justify-center text-olive-green text-[10px] font-bold">
                {ICONS[i % ICONS.length]}
              </span>
              <span>{u.title}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-600">
          <Link href="/contact" className="underline hover:text-olive-green transition-colors">
            View policies
          </Link>
        </div>
      </div>
    </div>
  );
};

const TrustBar: React.FC = () => {
  const { usps, delivery } = useSettings();
  return (
    <div className="w-full bg-gradient-to-r from-[#f8f1e8] via-[#f3e7da] to-[#f8f1e8] border-t border-b border-olive-green/10 py-10">
      <div className="section-shell">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {usps.map((item, i) => (
              <div
                key={item.title + i}
                className="flex items-start gap-3 section-card bg-white/85 shadow-sm p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-[#f1e4d4] flex items-center justify-center flex-shrink-0 text-base">
                  {ICONS[i % ICONS.length]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.body}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs text-slate-600 md:pl-4">
            <Link href="/contact" className="text-olive-green font-semibold underline-offset-4 hover:underline">
              Read policies
            </Link>
            <div className="text-slate-400 hidden sm:block">|</div>
            <div>
              {delivery.supportedCities
                ? `Delivery: ${delivery.supportedCities}.`
                : "Delivery coverage varies by PIN code."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
