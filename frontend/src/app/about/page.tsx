"use client";
import React from "react";
import Image from "next/image";
import studioImg from "../../assets/gallery5.png";
import Philosophy from "./components/Philosophy";
import Studio from "./components/Studio";
import Commitment from "./components/Commitment";
import CTA from "./components/CTA";
import { useSettings } from "@/lib/settings-context";

export default function AboutPage() {
  const settings = useSettings();
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Brand Story */}
      <section aria-labelledby="brand-story" className="mb-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="w-full h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-[0_28px_70px_rgba(24,20,13,0.12)]">
            <Image
              src={studioImg}
              alt={`${settings.name} floral arrangement`}
              className="object-cover w-full h-full"
              priority
            />
          </div>

          <div>
            <div className="pill mb-4">Our story</div>
            <h1 id="brand-story" className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-4">
              From the mandi to your door
            </h1>

            <p className="text-slate-600 mb-4 leading-relaxed">
              {settings.name} is a family-run flower business in Delhi NCR. Each morning we start at the wholesale mandi,
              hand-picking the freshest cut flowers — roses, lilies, orchids, carnations, sunflowers and seasonal stems —
              and supply them directly to homes, offices and corporate events through the day.
            </p>

            <p className="text-slate-600 mb-6 leading-relaxed">
              We focus on what we do best: a reliable supply of high-quality cut flowers and plants, plus custom bouquets and
              event arrangements built to order. Less middleman, more freshness — that&apos;s how we keep prices fair and stems vibrant.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="section-card bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">What we do</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Daily cut-flower supply, indoor plants, and corporate floral solutions across Delhi NCR.
                </p>
              </div>
              <div className="section-card bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">Why us</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Direct mandi sourcing means fresher stems and lower prices. Bulk-friendly for corporate and event orders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Philosophy />
      <Studio />
      <Commitment />
      <CTA />
    </main>
  );
}
