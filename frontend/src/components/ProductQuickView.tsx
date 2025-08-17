"use client";
import React, { useEffect, useRef } from 'react';
import Image, { StaticImageData } from 'next/image';
import { createPortal } from 'react-dom';

export type QuickViewProduct = {
  id: string;
  title: string;
  category: string;
  description?: string;
  img: StaticImageData;
  price: number;
  oldPrice?: number;
  rating?: number;
};

type Props = {
  product: QuickViewProduct | null;
  onClose: () => void;
  onAdd?: (id: string) => void;
  open: boolean;
};

// Accessible dialog for quick view
export default function ProductQuickView({ product, onClose, open, onAdd }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      ref.current?.focus();
      return () => { document.body.style.overflow = prevOverflow; };
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open || !product) return null;

  return createPortal(
    <div aria-modal="true" role="dialog" aria-label={`${product.title} quick view`} className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className="relative bg-white rounded-2xl shadow-xl w-[min(100%-2rem,760px)] max-h-[85vh] overflow-y-auto focus:outline-none">
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40">
          <span aria-hidden>✕</span>
        </button>
        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
            <Image src={product.img} alt={product.title} fill className="object-cover" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-2xl font-semibold text-slate-900">{product.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{product.category}</p>
            {product.rating && (
              <div className="flex items-center gap-1 mt-2" aria-label={`Rated ${product.rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`w-4 h-4 ${i < product.rating! ? 'text-amber-400' : 'text-amber-200'}`} viewBox="0 0 20 20" fill={i < product.rating! ? 'currentColor' : 'none'}>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.963 9.386c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
                  </svg>
                ))}
                <span className="ml-1 text-xs text-slate-500">({product.rating.toFixed(1)})</span>
              </div>
            )}
            <div className="mt-4 flex items-baseline gap-3">
              {product.oldPrice && (
                <span className="text-sm line-through text-slate-400">{new Intl.NumberFormat('en-IN',{ style:'currency', currency:'INR'}).format(product.oldPrice)}</span>
              )}
              <span className="text-2xl font-bold text-slate-900">{new Intl.NumberFormat('en-IN',{ style:'currency', currency:'INR'}).format(product.price)}</span>
              {product.oldPrice && (
                <span className="text-xs font-medium bg-rose-50 text-rose-600 px-2 py-1 rounded-full">{Math.round(((product.oldPrice - product.price)/product.oldPrice)*100)}% OFF</span>
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
              {product.description || 'A beautifully curated arrangement crafted with premium stems and careful detailing—perfect for celebrating your special moments.'}
            </p>
            <div className="mt-auto pt-6 flex flex-wrap gap-3">
              <button onClick={() => { onAdd?.(product.id); }} className="flex-1 inline-flex items-center justify-center gap-2 bg-olive-green text-white font-medium px-5 py-3 rounded-md shadow hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none"><path d="M3 3h2l.4 2M7 13h6l4-8H5.4M7 13l-1.2 3.6a.8.8 0 00.76 1.05H15" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/></svg>
                Add to cart
              </button>
              <button onClick={onClose} className="px-5 py-3 rounded-md border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
