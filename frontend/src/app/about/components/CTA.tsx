"use client";
import React from "react";
import Link from "next/link";

export default function CTA() {
  return (
    <section aria-labelledby="call-to-action" className="mb-12">
      <div className="section-card bg-gradient-to-r from-[#f8f1e8] via-[#f3e7da] to-[#f8f1e8] p-8 md:p-10 text-center">
        <div className="pill mx-auto mb-4">Ready to order?</div>
        <h2 id="call-to-action" className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight mb-3">
          Let&apos;s create something beautiful together
        </h2>
        <p className="text-slate-600 mb-7 max-w-xl mx-auto text-sm leading-relaxed">
          Browse our collection, plan an event, or simply send someone flowers today — we deliver across 8+ Indian cities with same-day options available.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-7">
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-6 py-3 bg-olive-green text-white rounded-full font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition focus:outline-none focus:ring-2 focus:ring-olive-green/30"
          >
            Shop flowers
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-olive-green text-olive-green rounded-full font-semibold text-sm hover:bg-olive-green/5 transition focus:outline-none focus:ring-2 focus:ring-olive-green/30"
          >
            Event inquiry
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-full font-semibold text-sm hover:border-olive-green/40 hover:text-olive-green transition focus:outline-none focus:ring-2 focus:ring-olive-green/30"
          >
            Get in touch
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm">
          <Link
            href="https://instagram.com/freshpetalsindia"
            target="_blank"
            rel="noopener noreferrer"
            className="text-olive-green font-semibold hover:underline"
          >
            Instagram
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            href="https://facebook.com/freshpetalsindia"
            target="_blank"
            rel="noopener noreferrer"
            className="text-olive-green font-semibold hover:underline"
          >
            Facebook
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/contact" className="text-olive-green font-semibold hover:underline">
            care@freshpetalsindia.com
          </Link>
        </div>
      </div>
    </section>
  );
}
