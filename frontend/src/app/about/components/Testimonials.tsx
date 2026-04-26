"use client";

import React from "react";

const testimonials = [
  {
    name: "Sana Kapoor",
    occasion: "Wedding",
    rating: 5,
    text: "The selection process was smooth and the flowers delivered matched the visual references shared on the website.",
  },
  {
    name: "Arjun Mehta",
    occasion: "Corporate Event",
    rating: 5,
    text: "Support was responsive and transparent on substitutions. Delivery timelines were clearly communicated.",
  },
  {
    name: "Priya Shah",
    occasion: "Birthday",
    rating: 4,
    text: "Easy ordering journey and accurate tracking updates. Great overall experience.",
  },
];

export default function Testimonials() {
  return (
    <section aria-labelledby="testimonials" className="mb-12">
      <h2 id="testimonials" className="text-2xl font-semibold text-gray-900 mb-6">
        Client Testimonials
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div key={t.name} className="bg-white rounded-lg p-5 border shadow-sm">
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-12 h-12 rounded-full bg-olive-green/10 text-olive-green font-semibold flex items-center justify-center">
                {t.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-800">{t.name}</div>
                <div className="text-sm text-gray-500">{t.occasion}</div>
              </div>
            </div>

            <div className="text-yellow-500 mb-3" aria-hidden>
              {Array.from({ length: t.rating }).map((_, i) => (
                <span key={`filled-${t.name}-${i}`} className="text-lg">
                  ★
                </span>
              ))}
              {Array.from({ length: 5 - t.rating }).map((_, i) => (
                <span key={`empty-${t.name}-${i}`} className="text-lg text-gray-300">
                  ★
                </span>
              ))}
            </div>

            <p className="text-sm text-gray-700">"{t.text}"</p>
          </div>
        ))}
      </div>
    </section>
  );
}
