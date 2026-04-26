"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type GalleryItem = {
  id: string;
  src: string;
  caption: string;
};

const items: GalleryItem[] = [
  {
    id: "e1",
    src: "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_4116-3.jpg?v=1697649468",
    caption: "Assorted cut flowers - centerpiece inspiration",
  },
  {
    id: "e2",
    src: "https://cdn.shopify.com/s/files/1/0047/4637/9362/products/CF1_6.jpg?v=1664723427",
    caption: "Roses - table styling reference",
  },
  {
    id: "e3",
    src: "https://cdn.shopify.com/s/files/1/0047/4637/9362/products/WES_4079_60de86c7-3385-4b2e-850d-297d9c8e2dfb.jpg?v=1722409287",
    caption: "Hydrangea - stage decor mood",
  },
  {
    id: "e4",
    src: "https://cdn.shopify.com/s/files/1/0047/4637/9362/products/OrientalLilies4.jpg?v=1623866047",
    caption: "Oriental lilies - premium event setup",
  },
  {
    id: "e5",
    src: "https://cdn.shopify.com/s/files/1/0047/4637/9362/products/WES_3378.jpg?v=1621319809",
    caption: "Dendrobium orchids - elegant aisle concept",
  },
  {
    id: "e6",
    src: "https://cdn.shopify.com/s/files/1/0047/4637/9362/products/Anthuriums_red_58660939-f2fc-47a6-9915-1375bd08c31c.jpg?v=1660561630",
    caption: "Anthuriums - statement corner build",
  },
  {
    id: "e7",
    src: "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5577.jpg?v=1709440942",
    caption: "Jumilla roses - mandap decor palette",
  },
  {
    id: "e8",
    src: "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5536.jpg?v=1709440820",
    caption: "Heliconia - tropical event accent",
  },
  {
    id: "e9",
    src: "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5647.jpg?v=1709453067",
    caption: "Mokara orchids - reception table highlight",
  },
  {
    id: "e10",
    src: "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_2854-2.jpg?v=1683533409",
    caption: "Helichrysums - stage texture layer",
  },
];

export default function EventInspirations() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight" && index !== null) {
        setIndex((i) => (i !== null && i < items.length - 1 ? i + 1 : i));
      }
      if (e.key === "ArrowLeft" && index !== null) {
        setIndex((i) => (i !== null && i > 0 ? i - 1 : i));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index]);

  function openAt(i: number) {
    setIndex(i);
    setOpen(true);
  }

  function next() {
    setIndex((i) => (i !== null && i < items.length - 1 ? i + 1 : i));
  }

  function prev() {
    setIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }

  return (
    <section className="section-shell mt-12">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="pill mb-3">Event gallery</div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
            Event Inspirations
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Visual references built using real product imagery from the live catalog.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Link
            href="/contact?inquiry=event"
            className="text-olive-green font-semibold underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-olive-green/30 rounded px-2 py-1"
          >
            Inquire about events
          </Link>
        </div>
      </div>

      <div className="columns-2 sm:columns-3 md:columns-4 gap-4">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            className="break-inside-avoid mb-4 relative rounded-xl overflow-hidden cursor-pointer shadow-[0_18px_40px_rgba(24,20,13,0.14)] w-full text-left"
            onClick={() => openAt(i)}
            aria-label={`Open ${it.caption}`}
          >
            <Image
              src={it.src}
              alt={it.caption}
              width={700}
              height={900}
              className="w-full h-auto block rounded-xl"
            />

            <div className="absolute left-2 bottom-2 bg-black/55 text-white text-[11px] px-2.5 py-1 rounded-full shadow">
              {it.caption}
            </div>
          </button>
        ))}
      </div>

      {open && index !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <button
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-white p-2 rounded-md hover:bg-white/10"
          >
            ✕
          </button>

          <button
            aria-label="Previous"
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-md hover:bg-white/10"
          >
            ‹
          </button>
          <div className="max-w-[90vw] max-h-[85vh] w-full flex items-center justify-center">
            <Image
              src={items[index].src}
              alt={items[index].caption}
              width={1200}
              height={900}
              className="max-w-full max-h-full rounded-2xl shadow-[0_32px_90px_rgba(0,0,0,0.35)] object-contain"
            />
          </div>
          <button
            aria-label="Next"
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-md hover:bg-white/10"
          >
            ›
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/90 bg-black/45 px-3 py-1 rounded-full shadow">
            {items[index].caption}
          </div>
        </div>
      )}
    </section>
  );
}
