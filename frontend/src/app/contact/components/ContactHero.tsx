"use client";

import React from "react";
import Image from "next/image";

const heroImg =
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5647.jpg?v=1709453067";

export default function ContactHero() {
  return (
    <section className="bg-rose-50 rounded-lg overflow-hidden mb-10 border border-olive-green/10">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6">
        <div className="p-8 sm:p-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">Let&apos;s Connect</h1>
          <p className="mt-4 text-lg text-gray-700">
            Need help with orders, bulk flowers, or event inquiries? Our support team is ready to help.
          </p>
          <p className="mt-2 text-gray-600">
            Share your requirement and we&apos;ll get back with options, pricing, and timelines.
          </p>
        </div>

        <div className="relative h-56 sm:h-72 lg:h-80">
          <Image src={heroImg} alt="Fresh flower support" fill className="object-cover" priority />
        </div>
      </div>
    </section>
  );
}
