"use client";
import React from "react";
import Image from "next/image";
import p4 from "../../../assets/person4.png";
import p5 from "../../../assets/person5.png";
import p6 from "../../../assets/person6.png";

const testimonials = [
  {
    name: "Sana Kapoor",
    occasion: "Wedding",
    img: p4,
    rating: 5,
    text: "The florals were breathtaking — the team understood our vision and executed it perfectly. Guests kept asking where we found them!",
  },
  {
    name: "Arjun Mehta",
    occasion: "Corporate Event",
    img: p5,
    rating: 5,
    text: "Professional, punctual, and wonderfully creative. The arrangements elevated our event and the team handled logistics flawlessly.",
  },
  {
    name: "Priya Shah",
    occasion: "Birthday",
    img: p6,
    rating: 4,
    text: "A warm, personal experience from start to finish — the bouquet was unique and felt truly handmade.",
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
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <Image src={t.img} alt={t.name} width={48} height={48} className="object-cover" />
              </div>
              <div>
                <div className="font-medium text-gray-800">{t.name}</div>
                <div className="text-sm text-gray-500">{t.occasion}</div>
              </div>
            </div>

            <div className="text-yellow-500 mb-3" aria-hidden>
              {Array.from({ length: t.rating }).map((_, i) => (
                <span key={i} className="text-lg">★</span>
              ))}
              {Array.from({ length: 5 - t.rating }).map((_, i) => (
                <span key={i} className="text-lg text-gray-300">★</span>
              ))}
            </div>

            <p className="text-sm text-gray-700">“{t.text}”</p>
          </div>
        ))}
      </div>
    </section>
  );
}
