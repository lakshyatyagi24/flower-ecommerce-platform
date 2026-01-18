"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function SocialNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | "idle" | "sending" | "sent" | "error">("idle");

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
        <div className="section-card bg-white/85 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-[0_18px_44px_rgba(24,20,13,0.12)]">
          <div>
            <div className="pill mb-3">Stay in bloom</div>
            <h3 className="text-2xl font-semibold text-slate-900">Follow us for floral inspiration</h3>
            <p className="text-sm text-slate-600 mt-1">Latest arrangements, behind-the-scenes, and concierge-only drops.</p>
            <div className="mt-3 flex items-center gap-3 text-sm text-olive-green font-semibold">
              <Link href="#" className="hover:underline">Instagram</Link>
              <span className="text-slate-300">•</span>
              <Link href="#" className="hover:underline">Facebook</Link>
              <span className="text-slate-300">•</span>
              <Link href="#" className="hover:underline">Pinterest</Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-0 bg-white border border-olive-green/15 rounded-full shadow-sm overflow-hidden">
            <label htmlFor="sn-email" className="sr-only">Email</label>
            <input
              id="sn-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="px-4 py-2.5 outline-none text-sm min-w-[220px]"
            />
            <button type="submit" className="px-5 py-2.5 bg-olive-green text-white text-sm font-semibold hover:opacity-95">
              {status === "sending" ? "Sending..." : "Subscribe"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
