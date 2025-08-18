"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function FAQSnapshot() {
  const faqs = [
    {
      q: "How long does delivery take?",
      a: "Standard delivery in metro cities is same-day or next-day depending on cut-off times; rural areas may take 2-3 days. Exact timelines are shown at checkout.",
    },
    {
      q: "Can I change or cancel an order?",
      a: "You can request changes within 30 minutes of placing an order; after dispatch we cannot guarantee changes. Contact support for urgent requests.",
    },
    {
      q: "How can I track my order?",
      a: "Use the Track Order link in the navbar or the tracking number we send by SMS/email to follow delivery status.",
    },
    {
      q: "What if the recipient is unavailable?",
      a: "We attempt delivery instructions you provided; if the recipient is unavailable, our courier will follow the fallback instructions (leave with neighbor or return to depot) and notify you via SMS.",
    },
    {
      q: "Do you handle bulk or corporate orders?",
      a: "Yes — for bulk/event orders please contact our events team via the Contact page so we can provide custom quotes and delivery slots.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section aria-labelledby="faq-snapshot" className="bg-beige border-t border-olive-green/10">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <h3 id="faq-snapshot" className="text-lg font-semibold text-olive-green">Quick FAQs</h3>
          <Link href="/faq" className="text-sm text-olive-green hover:underline">See full FAQ</Link>
        </div>

        <div className="mt-4 grid gap-3">
          {faqs.map((f, i) => (
            <div key={f.q} className="border rounded-md overflow-hidden border-olive-green/20">
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={openIndex === i}
                className="w-full text-left px-4 py-3 flex items-center justify-between text-sm bg-white hover:bg-olive-green/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40"
              >
                <span className="font-medium text-olive-green">{f.q}</span>
                <svg className={`w-5 h-5 transform transition-transform duration-150 ${openIndex === i ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4" />
                </svg>
              </button>

              {openIndex === i && (
                <div className="px-4 pb-4 text-sm text-slate-700">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
