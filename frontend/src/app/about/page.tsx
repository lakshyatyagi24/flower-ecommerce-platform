"use client";
import React from "react";
import Image from "next/image";
import studioImg from "../../assets/test2.png";
import Philosophy from "./components/Philosophy";
import Team from "./components/Team";
import Studio from "./components/Studio";
import Commitment from "./components/Commitment";
import Testimonials from "./components/Testimonials";
import Press from "./components/Press";
import CTA from "./components/CTA";

export default function AboutPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Brand Story - top of About page */}
      <section aria-labelledby="brand-story" className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="w-full h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden shadow-md">
            <Image
              src={studioImg}
              alt="Founder in studio"
              className="object-cover w-full h-full"
              priority
            />
          </div>

          <div>
            <h2 id="brand-story" className="text-3xl font-semibold text-gray-900 mb-4">
              Our Brand Story
            </h2>

            <p className="text-gray-700 mb-4">
              Born from late-night sketches and a love for simple, honest design,
              our brand began as a small studio where each bouquet was hand-tied
              with care. We blend time-honored floral techniques with a rustic
              aesthetic — favoring seasonal blooms, textured foliage, and a
              palette that feels like home.
            </p>

            <p className="text-gray-700 mb-6">
              Every arrangement carries a story: of the hands that cultivated
              the flowers, the artisan who arranged them, and the moments they
              help celebrate. We craft slowly, intentionally, and always with
              warmth — so what we deliver feels personal and true.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="text-sm font-medium text-gray-800">Mission</h3>
                <p className="text-sm text-gray-600 mt-1">
                  To reconnect people to the simple joy of gifting beautiful,
                  handcrafted floral experiences that celebrate the season.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="text-sm font-medium text-gray-800">Vision</h3>
                <p className="text-sm text-gray-600 mt-1">
                  To be known for thoughtful, sustainable floristry that brings
                  rustic charm into everyday life and meaningful moments.
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

      {/* ...existing page content could follow here... */}
    </main>
  );
}
