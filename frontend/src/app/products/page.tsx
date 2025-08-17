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
    <main className="w-full max-w-6xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold">Products{collection ? ` — ${collection.replace('-', ' ')}` : ''}</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {filtered.map(p => (
          <article key={p.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="relative w-full h-44 sm:h-48">
              <Image src={p.img} alt={p.title} fill className="object-cover" />
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm">{p.title}</h3>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-bold">{p.price}</span>
                <Link href={`/products/${p.id}`} className="text-olive-green font-medium">View</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
