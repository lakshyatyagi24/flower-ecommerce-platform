"use client";
import React from "react";
import Image from "next/image";
import studioImg from "../../assets/gallery5.png";
import Philosophy from "./components/Philosophy";
import Team from "./components/Team";
import Studio from "./components/Studio";
import Commitment from "./components/Commitment";
import Testimonials from "./components/Testimonials";
import CTA from "./components/CTA";

export default function AboutPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Brand Story */}
      <section aria-labelledby="brand-story" className="mb-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="w-full h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-[0_28px_70px_rgba(24,20,13,0.12)]">
            <Image
              src={studioImg}
              alt="Fresh Petals India floral arrangement"
              className="object-cover w-full h-full"
              priority
            />
          </div>

          <div>
            <div className="pill mb-4">Our story</div>
            <h1 id="brand-story" className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-4">
              From the farm to your door
            </h1>

            <p className="text-slate-600 mb-4 leading-relaxed">
              Fresh Petals India was founded with one purpose — to make the beauty of farm-fresh flowers accessible to everyone across India. We work directly with sustainable flower farms, cutting out middlemen so your blooms arrive at their freshest.
            </p>

            <p className="text-slate-600 mb-6 leading-relaxed">
              Every arrangement carries a story: of the growers who tended the stems, the florists who tied each bouquet, and the moments they help you celebrate. We believe a truly fresh flower is the most honest, beautiful gift you can give.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="section-card bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">Our mission</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  To connect India with farm-fresh flowers — delivered with care, speed, and a genuine love for floral beauty.
                </p>
              </div>
              <div className="section-card bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">Our vision</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  To be India&apos;s most trusted fresh flower brand — known for quality, sustainability, and same-day delivery across every major city.
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
      <Team />
      <CTA />
    </main>
  );
}
