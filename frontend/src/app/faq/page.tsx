"use client";
import React from "react";
import Link from "next/link";
import { categories } from "./faq-data";

export default function FAQPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-olive-green">Frequently Asked Questions</h1>
  <p className="mt-2 text-sm text-slate-600">Can&apos;t find an answer? Reach out via our <Link href="/contact" className="underline text-olive-green">Contact page</Link>.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-6">
        <nav className="order-1 lg:order-none">
          <h4 className="text-sm font-semibold text-slate-700">On this page</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`} className="text-olive-green hover:underline">{c.title}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-2 order-2">
          {categories.map((c) => (
            <section id={c.id} key={c.id} className="space-y-4">
              <h2 className="text-xl font-semibold text-olive-green">{c.title}</h2>
              <div className="mt-3 space-y-3">
                {c.items.map((it, idx) => (
                  <article key={it.q} className="p-4 border rounded-md border-olive-green/10 bg-white" id={`${c.id}-q-${idx}`}>
                    <h3 className="font-semibold text-olive-green">{it.q}</h3>
                    <p className="mt-2 text-sm text-slate-700">{it.a}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <Link href="/contact" className="inline-block bg-olive-green text-white px-4 py-2 rounded-md shadow-sm hover:opacity-95">Contact support</Link>
        <Link href="/" className="text-sm text-slate-600">Return to home</Link>
      </div>
    </main>
  );
}
