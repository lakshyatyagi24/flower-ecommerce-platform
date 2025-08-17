"use client";
import React from "react";
import Image from "next/image";

export default function CTA() {
  return (
    <section aria-labelledby="call-to-action" className="mb-12 bg-gray-50 p-8 rounded-lg border">
      <div className="max-w-3xl mx-auto text-center">
        <h2 id="call-to-action" className="text-2xl font-semibold text-gray-900 mb-3">Let’s create something beautiful together</h2>
        <p className="text-gray-600 mb-6">Explore our shop, book an event consultation, follow us on social, or drop by the studio — we’d love to hear from you.</p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
          <a href="/products" className="px-5 py-3 bg-green-700 text-white rounded-md font-medium">Shop bouquets</a>
          <a href="/contact?inquiry=event" className="px-5 py-3 border border-green-700 text-green-700 rounded-md font-medium">Event inquiry</a>
          <a href="/contact" className="px-5 py-3 bg-white text-green-700 border border-green-700 rounded-md font-medium">Let&apos;s Connect</a>
        </div>

        <div className="flex items-center justify-center space-x-4 mb-4">
          <a href="#" aria-label="Instagram" className="text-gray-600 hover:text-green-700">
            <Image src="/user-icon.svg" alt="Instagram" width={28} height={28} />
          </a>
          <a href="#" aria-label="Website" className="text-gray-600 hover:text-green-700">
            <Image src="/globe.svg" alt="Website" width={28} height={28} />
          </a>
          <a href="#" aria-label="Facebook" className="text-gray-600 hover:text-green-700">
            <Image src="/window.svg" alt="Facebook" width={28} height={28} />
          </a>
        </div>

        <div className="text-sm">
          <a href="/products" className="text-gray-700 hover:underline mr-4">Shop</a>
          <a href="/gallery" className="text-gray-700 hover:underline mr-4">Gallery</a>
          <a href="/contact?inquiry=visit" className="text-gray-700 hover:underline">Visit studio</a>
        </div>
      </div>
    </section>
  );
}
