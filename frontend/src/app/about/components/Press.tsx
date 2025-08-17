"use client";
import React from "react";
import Image from "next/image";
import dl1 from "../../../assets/dummyLogo1.png";
import dl2 from "../../../assets/dummyLogo2.png";
import dl3 from "../../../assets/dummyLogo3.png";
import dl4 from "../../../assets/dummyLogo4.png";
import dl5 from "../../../assets/dummyLogo5.png";

const partners = [
  { name: "Bloom Magazine", logo: dl1, quote: "A fresh approach to rustic floristry." },
  { name: "City Weddings", logo: dl2, quote: "Thoughtful designs that feel intimate and modern." },
  { name: "Boutique Events", logo: dl3, quote: "Perfect for small, curated celebrations." },
  { name: "Neighborhood Co-op", logo: dl4, quote: "A heart-forward partnership with local farms." },
  { name: "Events Collective", logo: dl5, quote: "Trusted for boutique and corporate events alike." },
];

export default function Press() {
  return (
    <section aria-labelledby="press" className="mb-12">
      <h2 id="press" className="text-2xl font-semibold text-gray-900 mb-6">Press & Partnerships</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((p) => (
          <div key={p.name} className="bg-white rounded-lg p-6 border flex flex-col items-center text-center min-h-[150px]">
            <div className="w-24 h-24 mb-4 flex items-center justify-center">
              <Image src={p.logo} alt={`${p.name} logo`} width={96} height={96} className="object-contain" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">“{p.quote}”</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <a href="/press" className="text-sm font-medium text-green-700 hover:underline">See all press</a>
      </div>
    </section>
  );
}
