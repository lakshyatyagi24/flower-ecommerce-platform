"use client";
import React from "react";
import Image from "next/image";
import g1 from "../../../assets/gallery1.png";
import g2 from "../../../assets/gallery2.png";
import g3 from "../../../assets/gallery3.png";
import g4 from "../../../assets/gallery4.png";

export default function Studio() {
  const timeline = [
    { step: "Sourcing", desc: "Careful selection of seasonal, local blooms." },
    { step: "Design", desc: "Sketching and composing palettes by hand." },
    { step: "Crafting", desc: "Hand-tying, wrapping, and finishing details." },
    { step: "Delivery", desc: "Careful packaging and timely delivery." },
  ];

  return (
    <section aria-labelledby="our-studio" className="mb-12">
      <h2 id="our-studio" className="text-2xl font-semibold text-gray-900 mb-4">
        Our Studio & Process
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <p className="text-gray-600 mb-4">
            We work in a small workshop where textures, color and scent guide every decision. Below are a few behind-the-scenes moments that show how arrangements come together.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="w-full h-40 rounded overflow-hidden">
              <Image src={g1} alt="studio shot 1" className="object-cover w-full h-full" />
            </div>
            <div className="w-full h-40 rounded overflow-hidden">
              <Image src={g2} alt="studio shot 2" className="object-cover w-full h-full" />
            </div>
            <div className="w-full h-40 rounded overflow-hidden">
              <Image src={g3} alt="studio shot 3" className="object-cover w-full h-full" />
            </div>
            <div className="w-full h-40 rounded overflow-hidden">
              <Image src={g4} alt="studio shot 4" className="object-cover w-full h-full" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Process timeline</h3>
          <ol className="space-y-4 mb-6">
            {timeline.map((t) => (
              <li key={t.step} className="flex">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 mr-3 text-sm font-medium text-gray-700">{t.step[0]}</div>
                <div>
                  <div className="font-medium text-gray-800">{t.step}</div>
                  <div className="text-sm text-gray-600">{t.desc}</div>
                </div>
              </li>
            ))}
          </ol>

          <h3 className="text-lg font-medium text-gray-800 mb-2">Why we do it this way</h3>
          <p className="text-gray-600">
            Choosing local, seasonal blooms and crafting by hand lets us prioritize freshness, reduce waste, and offer unique designs rooted in each season. This slower approach ensures every piece feels intentional and personal.
          </p>
        </div>
      </div>
    </section>
  );
}
