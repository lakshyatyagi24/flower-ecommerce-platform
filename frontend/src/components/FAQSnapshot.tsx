"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function FAQSnapshot() {
  const faqs = [
    {
      q: "What are the delivery timings?",
      a: "Orders placed before 3:00 PM are eligible for same-day delivery. Next-day and scheduled delivery slots are available at checkout. We deliver across Bangalore, Delhi NCR, Mumbai, Hyderabad, Pune, Chennai, Kolkata and more — enter your PIN code at checkout to confirm availability.",
    },
    {
      q: "How fresh are the flowers?",
      a: "All blooms are sourced directly from sustainable farms and dispatched within 24–48 hours of harvest. They arrive vibrant, fragrant, and ready to impress — not days old from a warehouse.",
    },
    {
      q: "Can I customise a bouquet?",
      a: "Absolutely. You can request a custom arrangement — specific flowers, colours, sizes, or add-ons like vases and chocolates — via our Contact page. We also handle bulk and corporate event orders.",
    },
    {
      q: "What if my flowers arrive damaged?",
      a: "We stand behind every order. If your flowers arrive wilted or damaged, contact us within 48 hours with a photo and we will arrange a replacement or full refund — no hassle.",
    },
    {
      q: "Do you deliver on Sundays and public holidays?",
      a: "Yes, we deliver 7 days a week including Sundays and most public holidays. During peak seasons (Valentine's Day, Diwali, etc.) we recommend ordering in advance to secure your preferred time slot.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section aria-labelledby="faq-snapshot" className="bg-beige border-t border-olive-green/10">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <h3 id="faq-snapshot" className="text-lg font-semibold text-olive-green">Quick FAQs</h3>
          <Link href="/contact" className="text-sm text-olive-green hover:underline">Contact us</Link>
        </div>

        <div className="mt-4 grid gap-2">
          {faqs.map((f, i) => (
            <div key={f.q} className="border rounded-xl overflow-hidden border-olive-green/15">
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={openIndex === i}
                className="w-full text-left px-4 py-3.5 flex items-center justify-between text-sm bg-white hover:bg-[#f9f4ee] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40 transition-colors"
              >
                <span className="font-medium text-slate-800">{f.q}</span>
                <svg
                  className={`w-5 h-5 flex-shrink-0 ml-3 text-olive-green/60 transform transition-transform duration-200 ${openIndex === i ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4" />
                </svg>
              </button>

              {openIndex === i && (
                <div className="px-4 pb-4 pt-1 text-sm text-slate-600 leading-relaxed bg-white border-t border-olive-green/10">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
