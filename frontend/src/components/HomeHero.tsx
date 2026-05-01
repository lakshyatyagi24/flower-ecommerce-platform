"use client";

import React from "react";
import Link from "next/link";
import { useSettings } from "@/lib/settings-context";

const HomeHero: React.FC = () => {
  const { hero } = useSettings();
  return (
    <section className="section-shell mt-10 mb-6 text-center">
      {hero.eyebrow && <p className="pill mx-auto mb-3">{hero.eyebrow}</p>}
      {hero.title && (
        <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-tight">
          {hero.title}
        </h1>
      )}
      {hero.subtitle && (
        <p className="mt-3 text-lg text-slate-700 max-w-3xl mx-auto">{hero.subtitle}</p>
      )}
      {hero.ctaLabel && hero.ctaHref && (
        <div className="mt-6">
          <Link
            href={hero.ctaHref}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-olive-green text-white px-8 py-3 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            {hero.ctaLabel}
          </Link>
        </div>
      )}
    </section>
  );
};

export default HomeHero;
