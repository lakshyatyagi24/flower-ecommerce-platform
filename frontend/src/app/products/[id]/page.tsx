import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { products } from "@/lib/products";
import Link from "next/link";

export async function generateStaticParams() {
  return products.map((product) => ({
    id: product.id,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProductPage(props: any) {
  const id = props?.params?.id as string;
  const product = products.find(p => p.id === id);
  if (!product) return notFound();

  return (
    <main className="section-shell mt-12 mb-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="relative w-full h-[480px] lg:h-[560px] bg-white rounded-3xl overflow-hidden shadow-[0_28px_70px_rgba(24,20,13,0.14)]">
          <Image src={product.img} alt={product.title} fill className="object-cover" />
          <div className="absolute top-4 left-4 pill">New arrival</div>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <p className="pill mb-3">Magnolia Lane Edit</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight">{product.title}</h1>
            <p className="mt-3 text-slate-700 leading-relaxed">{product.description ?? 'Luxe florals wrapped in velvet ribbons with layered purple hues inspired by Rebecca Purple. Hand delivered with our signature keepsake packaging.'}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-olive-green">{product.price}</span>
            <span className="text-sm uppercase tracking-[0.16em] text-olive-green/70">Inclusive of taxes</span>
          </div>

          <ul className="space-y-2 text-sm text-slate-700 bg-white/70 border border-olive-green/10 rounded-2xl p-4">
            <li>• Velvet ribboning & keepsake note</li>
            <li>• Same-day delivery across Mumbai & NCR</li>
            <li>• Artisanal hydration pouch for freshness</li>
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-olive-green text-white px-6 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
              Add to cart
            </button>
            <Link href="/products" className="text-olive-green font-semibold underline-offset-4 hover:underline">Back to collections</Link>
          </div>

          <div className="mt-6 text-xs uppercase tracking-[0.18em] text-olive-green/70">Crafted with sustainable packaging</div>
        </div>
      </div>
    </main>
  );
}
