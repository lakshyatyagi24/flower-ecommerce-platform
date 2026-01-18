import React from "react";
import Image from "next/image";
import Link from "next/link";
import { products as allProducts, Product } from "@/lib/products";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProductsPage(props: any) {
  const searchParams = props?.searchParams as { [key: string]: string | string[] | undefined } | undefined;
  const collection = typeof searchParams?.collection === 'string' ? searchParams.collection : undefined;
  const filtered: Product[] = collection ? allProducts.filter(p => p.collection === collection) : allProducts;

  return (
    <main className="section-shell mt-12 mb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="pill mb-3">Curated collections</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">{collection ? collection.replace('-', ' ') : 'All florals'}</h1>
          <p className="text-slate-700 mt-2">Lush palettes, artisanal wrapping, and indulgent gifting inspired by Magnolia Lane.</p>
        </div>
        <Link href="/" className="text-olive-green font-semibold underline-offset-4 hover:underline">Back to home</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map(p => (
          <article key={p.id} className="section-card overflow-hidden group">
            <div className="relative w-full h-48 sm:h-56">
              <Image src={p.img} alt={p.title} fill className="object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className="p-4 flex flex-col gap-2">
              <span className="text-[12px] uppercase tracking-[0.14em] text-olive-green/70">Limited</span>
              <h3 className="font-semibold text-lg text-slate-900">{p.title}</h3>
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span className="font-semibold text-olive-green">{p.price}</span>
                <Link href={`/products/${p.id}`} className="text-olive-green font-medium hover:underline">View</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
