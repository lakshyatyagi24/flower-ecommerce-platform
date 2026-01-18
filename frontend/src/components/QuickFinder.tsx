"use client";

import React from 'react';
import Link from 'next/link';

type Tile = { id: string; label: string; href: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> };

const tiles: Tile[] = [
  {
    id: 'birthday',
    label: 'Birthday',
    href: '/products?occasion=birthday',
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 7h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'anniversary',
    label: 'Anniversary',
    href: '/products?occasion=anniversary',
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 21s-6-4.35-8-7a5 5 0 0 1 8-6 5 5 0 0 1 8 6c-2 2.65-8 7-8 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'sympathy',
    label: 'Sympathy',
    href: '/products?occasion=sympathy',
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 10c1 2 2 3 5 3s4-1 5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 20h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'congrats',
    label: 'Congratulations',
    href: '/products?occasion=congratulations',
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 21l5-4 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function QuickFinder() {
  return (
    <section className="section-shell mt-10 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="pill">Shop by feeling</div>
        <span className="text-xs uppercase tracking-[0.14em] text-olive-green/70">Concierge curation</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-label={`Shop ${t.label}`}
            className="flex items-center gap-3 p-4 section-card hover:-translate-y-0.5 transition transform hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-olive-green/30"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#f1e4d4] text-olive-green">
              <t.Icon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] uppercase tracking-[0.12em] text-olive-green/70">Occasion</span>
              <span className="text-base font-semibold text-slate-900">{t.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
