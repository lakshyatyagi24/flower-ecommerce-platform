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
        <path d="M12 3c0 0-1.5 2.5 0 4s3 0 1.5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 7h10v11a2 2 0 01-2 2H9a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 14h6M9 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'anniversary',
    label: 'Anniversary',
    href: '/products?occasion=anniversary',
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 21s-6-4.35-8-7a5 5 0 018-6 5 5 0 018 6c-2 2.65-8 7-8 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'wedding',
    label: 'Wedding',
    href: '/products?occasion=wedding',
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M8 7h8M8 12h8M8 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 4h16v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'corporate',
    label: 'Corporate',
    href: '/products?occasion=corporate',
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M3 21h18M5 21V7l7-4 7 4v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21v-5h6v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
        <path d="M12 2l1.8 4.6L18 8l-3.6 2.6.9 4.4-3.3-2-3.3 2 .9-4.4L6 8l4.2-1.4L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 20h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'getwell',
    label: 'Get Well Soon',
    href: '/products?occasion=get-well',
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 2a9 9 0 110 18A9 9 0 0112 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'justbecause',
    label: 'Just Because',
    href: '/products',
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function QuickFinder() {
  return (
    <section className="section-shell mt-10 mb-8">
      <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
        <div>
          <div className="pill mb-2">Shop by occasion</div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Find the perfect flowers</h2>
        </div>
        <Link href="/products" className="text-sm text-olive-green font-semibold hover:underline">View all flowers →</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-label={`Shop flowers for ${t.label}`}
            className="flex items-center gap-3 p-4 section-card hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-olive-green/30"
          >
            <div className="w-11 h-11 flex items-center justify-center rounded-full bg-[#f1e4d4] text-[#4a3b2a] flex-shrink-0">
              <t.Icon className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] uppercase tracking-[0.1em] text-olive-green/60 font-medium">Flowers for</span>
              <span className="text-sm font-semibold text-slate-900 truncate">{t.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
