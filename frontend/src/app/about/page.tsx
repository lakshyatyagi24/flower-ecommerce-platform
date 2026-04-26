"use client";

import React from "react";
import Image from "next/image";
import Philosophy from "./components/Philosophy";
import Team from "./components/Team";
import Studio from "./components/Studio";
import Commitment from "./components/Commitment";
import Testimonials from "./components/Testimonials";
import Press from "./components/Press";
import CTA from "./components/CTA";

const heroImage =
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_4116-3.jpg?v=1697649468";

export default function AboutPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <section aria-labelledby="brand-story" className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="w-full h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden shadow-md relative">
            <Image src={heroImage} alt="Fresh flowers in studio" fill className="object-cover" priority />
          </div>

          <div>
            <h2 id="brand-story" className="text-3xl font-semibold text-gray-900 mb-4">
              Our Brand Story
            </h2>

            <p className="text-gray-700 mb-4">
              Fresh Petals India started with one simple goal: make premium flowers easier to browse, trust, and order.
              We focus on real product imagery, accurate listings, and reliable delivery support.
            </p>

            <p className="text-gray-700 mb-6">
              Our catalog and storefront are continuously aligned so customers can confidently choose flowers for gifting,
              events, and everyday decor without guessing what will actually arrive.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="text-sm font-medium text-gray-800">Mission</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Deliver dependable floral shopping with transparent product data and visual consistency.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="text-sm font-medium text-gray-800">Vision</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Build India&apos;s most trusted digital flower marketplace for retail and event buyers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Philosophy />
      <Studio />
      <Commitment />
      <Testimonials />
      <Press />
      <Team />
      <CTA />
    </main>
  );
}
