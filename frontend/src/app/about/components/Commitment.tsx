"use client";
import React from "react";
import Image from "next/image";

export default function Commitment() {
  const initiatives = [
    { title: "Ethical sourcing", desc: "Partnering with local, small-scale growers and fair-trade suppliers.", icon: "/globe.svg" },
    { title: "Eco packaging", desc: "Compostable wraps and recycled materials to reduce waste.", icon: "/file.svg" },
    { title: "Local partnerships", desc: "Working directly with nearby flower farmers to support community resilience.", icon: "/india-flag.svg" },
    { title: "Giving back", desc: "Donations and events that support local causes and floriculture education.", icon: "/checkmark.svg" },
  ];

  return (
    <section aria-labelledby="our-commitment" className="mb-12">
      <h2 id="our-commitment" className="text-2xl font-semibold text-gray-900 mb-4">
        Our Commitment — Sustainability & Community
      </h2>

      <p className="text-gray-600 mb-6">We prioritize responsible practices and community partnerships in every step of our work.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {initiatives.map((it) => (
            <div key={it.title} className="flex items-start space-x-4 bg-white p-4 rounded-lg border">
              <div className="flex-shrink-0">
                <Image src={it.icon} alt={`${it.title} icon`} width={40} height={40} />
              </div>
              <div>
                <div className="font-medium text-gray-800">{it.title}</div>
                <div className="text-sm text-gray-600">{it.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-lg font-medium mb-2">Why this matters</h3>
          <p className="text-sm text-gray-600 mb-4">
            Sustainability isn&apos;t a label — it&apos;s a daily practice. By choosing local flowers, reducing packaging waste, and investing in the people who grow our blooms, we build a healthier supply chain and a stronger community.
          </p>

          <ul className="list-disc list-inside text-sm text-gray-700 mb-4">
            <li>Reduced transport emissions through local sourcing</li>
            <li>Lower landfill impact via compostable and recycled packaging</li>
            <li>Support for small growers through direct partnerships</li>
          </ul>

          <a href="/sustainability" className="inline-block text-sm font-medium text-green-700 hover:underline">Read our full sustainability policy</a>
        </div>
      </div>
    </section>
  );
}
