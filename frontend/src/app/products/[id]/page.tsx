import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { products } from "@/lib/products";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProductPage(props: any) {
  const id = props?.params?.id as string;
  const product = products.find(p => p.id === id);
  if (!product) return notFound();

  return (
    <main className="w-full max-w-4xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative w-full h-80 bg-white rounded-2xl overflow-hidden">
          <Image src={product.img} alt={product.title} fill className="object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{product.title}</h1>
          <p className="mt-2 text-slate-700">{product.description}</p>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-2xl font-bold">{product.price}</span>
            <button className="inline-flex items-center gap-2 rounded-md bg-olive-green text-white px-4 py-2 text-sm font-medium shadow-sm hover:opacity-95">Add to cart</button>
          </div>
          <div className="mt-6">
            <Link href="/products" className="text-slate-500 hover:underline">Back to products</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
