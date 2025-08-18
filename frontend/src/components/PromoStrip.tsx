"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "promo_strip_hidden_v1";

const PromoStrip: React.FC = () => {
  const [hidden, setHidden] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Config - tweak these values as needed
  const promoText = "Free same-day delivery on orders before 3:00 PM — limited time!";
  const cutoffTime = ""; // set to null or '' to disable countdown
  const cta = { href: "/collections/same-day", label: "Shop Same-Day" };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setHidden(true);
    } catch {
      /* ignore storage errors */
    }
    // entrance
    setTimeout(() => setMounted(true), 40);
  }, []);

  useEffect(() => {
    if (!cutoffTime) return;
    const update = () => {
      const now = new Date();
      const [h, m] = cutoffTime.split(":").map(Number);
      const cutoff = new Date(now);
      cutoff.setHours(h, m, 0, 0);
      let diff = cutoff.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown(null);
        return;
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      diff -= hrs * 1000 * 60 * 60;
      const mins = Math.floor(diff / (1000 * 60));
      diff -= mins * 1000 * 60;
      const secs = Math.floor(diff / 1000);
      setCountdown(`${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const close = () => {
    setHidden(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore storage errors */
    }
  };

  if (hidden) return null;

  return (
    <div className={`w-full promo-strip ${mounted ? 'promo-enter' : 'promo-hide'}`} role="region" aria-live="polite">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-12 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/90 shadow-sm promo-icon" aria-hidden>
            <svg className="w-5 h-5 text-amber-600 transform-gpu" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l1.8 4.6L18 8l-3.6 2.6L14 15l-2-1.3L10 15l.6-4.4L7 8l4.2-.9L12 2z" />
            </svg>
          </div>

          <div className="leading-tight">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-900 text-sm md:text-base">{promoText}</span>
                <span className="promo-badge" aria-hidden>LIMITED</span>
              </div>
              {countdown && (
                <div className="text-amber-700 text-xs md:text-sm">Order by <strong className="font-medium">{cutoffTime}</strong> — <span className="font-mono">{countdown}</span></div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={cta.href} className="promo-cta" aria-label={`${cta.label}. Opens collection` }>
            <span className="promo-cta-label">{cta.label}</span>
          </Link>

          <button
            aria-label="Dismiss promo"
            onClick={close}
            className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
          >
            <svg className="w-4 h-4 text-amber-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M14.348 5.652a.5.5 0 10-.707-.707L10 8.586 6.36 4.945a.5.5 0 10-.707.707L9.293 9.293 5.652 12.934a.5.5 0 10.707.707L10 10l3.64 3.64a.5.5 0 10.707-.707L10.707 9.293l3.641-3.641z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoStrip;
