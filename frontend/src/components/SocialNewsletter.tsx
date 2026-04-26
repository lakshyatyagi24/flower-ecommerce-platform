"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function SocialNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    try {
      await new Promise((r) => setTimeout(r, 600));
      setStatus("sent");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="bg-gradient-to-r from-[#f8f1e8] via-[#f3e7da] to-[#f8f1e8] border-t border-olive-green/10 py-12 mt-12">
      <div className="section-shell">
        <div className="section-card bg-white/85 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-[0_18px_44px_rgba(24,20,13,0.10)]">
          <div>
            <div className="pill mb-3">Stay in bloom</div>
            <h3 className="text-2xl font-semibold text-slate-900">Fresh flowers, fresh ideas</h3>
            <p className="text-sm text-slate-600 mt-1 max-w-sm">
              New arrivals, seasonal specials, care tips, and exclusive offers — straight to your inbox.
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <Link
                href="https://instagram.com/freshpetalsindia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-olive-green font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded"
              >
                Instagram
              </Link>
              <span className="text-slate-300">•</span>
              <Link
                href="https://facebook.com/freshpetalsindia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-olive-green font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded"
              >
                Facebook
              </Link>
              <span className="text-slate-300">•</span>
              <Link
                href="https://pinterest.com/freshpetalsindia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-olive-green font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded"
              >
                Pinterest
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-auto">
            {status === "sent" ? (
              <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-700 font-medium">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>You're subscribed! Thank you.</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex items-stretch gap-0 bg-white border border-olive-green/20 rounded-full shadow-sm overflow-hidden"
              >
                <label htmlFor="sn-email" className="sr-only">Your email address</label>
                <input
                  id="sn-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="px-5 py-2.5 outline-none text-sm min-w-[200px] bg-transparent"
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="px-5 py-2.5 bg-olive-green text-white text-sm font-semibold hover:opacity-95 disabled:opacity-60 transition-opacity"
                >
                  {status === "sending" ? "Subscribing…" : "Subscribe"}
                </button>
              </form>
            )}
            {status === "error" && (
              <p className="mt-2 text-xs text-red-600">Something went wrong. Please try again.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
