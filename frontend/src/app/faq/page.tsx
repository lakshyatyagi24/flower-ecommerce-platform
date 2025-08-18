"use client";
import React from "react";
import Link from "next/link";

const categories = [
  {
    id: "orders",
    title: "Orders",
    items: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery in metro cities is same-day or next-day depending on cut-off times. Rural areas may take 2-3 days. You can get a delivery estimate on the product page and at checkout by entering the pin code.",
      },
      {
        q: "Can I change or cancel an order?",
        a: "You can request changes within 30 minutes of placing an order. After dispatch we cannot guarantee changes; please contact support immediately and we'll do our best to help.",
      },
      {
        q: "What if the recipient is unavailable?",
        a: "Our courier follows any delivery instructions you provide. If the recipient is unavailable, the courier will attempt a safe handover (neighbor/concierge) or return to the local depot and notify you. Re-delivery fees may apply in some areas.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: "We accept major credit/debit cards, net banking, UPI and popular wallets. All payments are processed through secure, encrypted gateways.",
      },
      {
        q: "How do refunds work?",
        a: "If an item is eligible for a refund (damaged or not as described), we'll process refunds after we verify the issue—typically within 5–7 business days depending on the payment provider.",
      },
    ],
  },
  {
    id: "shipping",
    title: "Shipping & Delivery",
    items: [
      {
        q: "Do you offer same-day delivery?",
        a: "Same-day delivery is available in selected metro locations for orders placed before the cut-off time. Delivery availability is shown on the product page and at checkout.",
      },
      {
        q: "Can I provide delivery instructions?",
        a: "Yes — you can add delivery instructions at checkout (e.g., leave with neighbor, call before delivery). We pass this to the courier.",
      },
    ],
  },
  {
    id: "corporate",
    title: "Corporate & Events",
    items: [
      {
        q: "Do you handle bulk or corporate orders?",
        a: "Yes. For bulk or event orders, contact our Events team via the Contact page so we can provide a custom quote, scheduling, and dedicated support.",
      },
    ],
  },
];

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
