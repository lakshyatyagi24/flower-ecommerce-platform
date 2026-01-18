"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

import Image, { type StaticImageData } from "next/image";
import g1 from "../assets/gallery1.png";
import g2 from "../assets/gallery2.png";
import g3 from "../assets/gallery3.png";
import g4 from "../assets/gallery4.png";
import g5 from "../assets/gallery5.png";
import g6 from "../assets/gallery6.png";
import g7 from "../assets/gallery7.png";
import g8 from "../assets/gallery8.png";
import g9 from "../assets/gallery9.png";
import g10 from "../assets/gallery10.png";

type GalleryItem = {
  id: string;
  src: StaticImageData;
  caption: string;
};

const items: GalleryItem[] = [
  { id: "e1", src: g1, caption: "Riverside — Outdoor Wedding" },
  { id: "e2", src: g2, caption: "Ballroom — Corporate Gala" },
  { id: "e3", src: g3, caption: "Heritage Lawn — Garden Party" },
  { id: "e4", src: g4, caption: "Rooftop — Intimate Reception" },
  { id: "e5", src: g5, caption: "Banquet Hall — Anniversary" },
  { id: "e6", src: g6, caption: "Terrace — Pop-up Event" },
  { id: "e7", src: g7, caption: "Vineyard — Sunset Ceremony" },
  { id: "e8", src: g8, caption: "Loft — Modern Soirée" },
  { id: "e9", src: g9, caption: "Heritage Home — Intimate Dinner" },
  { id: "e10", src: g10, caption: "Botanical — Photo Shoot" },
];

export default function EventInspirations() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight" && index !== null) setIndex((i) => (i! < items.length - 1 ? i! + 1 : i));
      if (e.key === "ArrowLeft" && index !== null) setIndex((i) => (i! > 0 ? i! - 1 : i));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index]);

  function openAt(i: number) {
    setIndex(i);
    setOpen(true);
  }

  function next() {
    if (index === null) return;
    setIndex((i) => (i! < items.length - 1 ? i! + 1 : i));
  }

  function prev() {
    if (index === null) return;
    setIndex((i) => (i! > 0 ? i! - 1 : i));
  }

  return (
    <section className="section-shell mt-12">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="pill mb-3">Atelier stories</div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">Event Inspirations</h2>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">A mosaic of past setups to showcase our style — tap any image to enlarge and envision your soirée.</p>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="#contact" className="text-olive-green font-semibold underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded px-2 py-1">Inquire About Events</Link>
        </div>
      </div>

      {/* Masonry-like columns using CSS columns */}
      <div className="columns-2 sm:columns-3 md:columns-4 gap-4">
        {items.slice(0, 10).map((it, i) => (
          <div key={it.id} className="break-inside-avoid mb-4 relative rounded-xl overflow-hidden cursor-pointer shadow-[0_18px_40px_rgba(24,20,13,0.14)]" onClick={() => openAt(i)} role="button" aria-label={`Open ${it.caption}`}>
            <Image src={it.src} alt={it.caption} className="w-full h-auto block rounded-xl" />

            <div className="absolute left-2 bottom-2 bg-black/55 text-white text-[11px] px-2.5 py-1 rounded-full shadow">{it.caption}</div>

            {/* subtle watermark */}
            <div className="absolute right-3 top-3 text-[10px] uppercase tracking-[0.2em] text-white/70 pointer-events-none select-none">1ML Atelier</div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {open && index !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <button aria-label="Close" onClick={() => setOpen(false)} className="absolute top-4 right-4 text-white p-2 rounded-md hover:bg-white/10">✕</button>

          <button aria-label="Previous" onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-md hover:bg-white/10">‹</button>
          <div className="max-w-[90vw] max-h-[85vh] w-full flex items-center justify-center">
            <Image src={items[index].src} alt={items[index].caption} className="max-w-full max-h-full rounded-2xl shadow-[0_32px_90px_rgba(0,0,0,0.35)] object-contain" />
          </div>
          <button aria-label="Next" onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-md hover:bg-white/10">›</button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/90 bg-black/45 px-3 py-1 rounded-full shadow">{items[index].caption}</div>
        </div>
      )}
    </section>
  );
}
