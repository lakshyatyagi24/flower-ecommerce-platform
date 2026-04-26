"use client";

import React from "react";
import Image from "next/image";

const studioImages = [
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/products/WES_4079_60de86c7-3385-4b2e-850d-297d9c8e2dfb.jpg?v=1722409287",
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/products/WES_3378.jpg?v=1621319809",
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5577.jpg?v=1709440942",
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5536.jpg?v=1709440820",
];

export default function Studio() {
  const timeline = [
    { step: "Sourcing", desc: "Selecting fresh stems from trusted growers and suppliers." },
    { step: "Verification", desc: "Validating image quality, metadata, and product descriptions." },
    { step: "Publishing", desc: "Syncing catalog updates into storefront collections and pages." },
    { step: "Fulfillment", desc: "Coordinating packaging and dispatch with delivery updates." },
  ];

  return (
    <section aria-labelledby="our-studio" className="mb-12">
      <h2 id="our-studio" className="text-2xl font-semibold text-gray-900 mb-4">
        Our Studio & Process
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <p className="text-gray-600 mb-4">
            The storefront is built around real visual references and consistent product data so shoppers can trust every listing.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {studioImages.map((src, idx) => (
              <div key={`studio-${idx}`} className="w-full h-40 rounded overflow-hidden relative">
                <Image src={src} alt={`Studio process ${idx + 1}`} fill className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Process timeline</h3>
          <ol className="space-y-4 mb-6">
            {timeline.map((t) => (
              <li key={t.step} className="flex">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 mr-3 text-sm font-medium text-gray-700">
                  {t.step[0]}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{t.step}</div>
                  <div className="text-sm text-gray-600">{t.desc}</div>
                </div>
              </li>
            ))}
          </ol>

          <h3 className="text-lg font-medium text-gray-800 mb-2">Why this process works</h3>
          <p className="text-gray-600">
            Keeping visual assets and catalog data synchronized reduces ordering errors and improves confidence for both personal and event purchases.
          </p>
        </div>
      </div>
    </section>
  );
}
