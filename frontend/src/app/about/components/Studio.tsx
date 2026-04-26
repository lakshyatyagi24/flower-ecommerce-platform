"use client";
import React from "react";
import Image from "next/image";
import g1 from "../../../assets/gallery1.png";
import g2 from "../../../assets/gallery2.png";
import g3 from "../../../assets/gallery3.png";
import g4 from "../../../assets/gallery4.png";

const process = [
  {
    step: "Farm sourcing",
    desc: "We select blooms directly from partner farms — prioritising seasonal, locally-grown stems at peak freshness.",
  },
  {
    step: "Quality grading",
    desc: "Every batch is checked for stem integrity, colour vibrancy, and bud stage before packing.",
  },
  {
    step: "Expert arranging",
    desc: "Bouquets are hand-tied by our florists using proven techniques for balance, longevity, and visual impact.",
  },
  {
    step: "Same-day delivery",
    desc: "Packed in insulated boxes with flower food, dispatched by 4 PM for same-day delivery across major cities.",
  },
];

export default function Studio() {
  return (
    <section aria-labelledby="our-process" className="mb-14">
      <div className="pill mb-3">How it works</div>
      <h2 id="our-process" className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight mb-2">
        From Farm to Your Door
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-6">
        <div>
          <p className="text-slate-600 mb-5 text-sm leading-relaxed">
            Every Fresh Petals India order follows a careful journey — from hand-picked farm blooms to beautifully arranged bouquets, packed and delivered the same day.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[g1, g2, g3, g4].map((img, i) => (
              <div key={i} className="w-full h-40 rounded-xl overflow-hidden shadow-sm">
                <Image src={img} alt={`Fresh Petals India behind the scenes ${i + 1}`} className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-4">Our process</h3>
          <ol className="space-y-4">
            {process.map((t, i) => (
              <li key={t.step} className="flex gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f1e4d4] text-[#4a3b2a] font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{t.step}</div>
                  <div className="text-sm text-slate-500 mt-0.5 leading-relaxed">{t.desc}</div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 p-4 rounded-xl bg-[#f8f4ee] border border-olive-green/10">
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Why direct from farms?</strong> Skipping wholesale markets means your flowers are 2–3 days fresher than those from traditional florists — and growers earn a fairer price.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
