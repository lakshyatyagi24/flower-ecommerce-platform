'use client';
import { useProducts, ProductCard } from '@/modules/products';
import React from 'react';

export default function ProductCatalogPage() {
  const { products, loading } = useProducts();

  if (loading) {
    return <div className="text-center p-8 font-serif">Loading products…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pt-12 px-2">
      <h1 className="text-4xl font-serif font-bold mb-10 text-center text-brown-800">
        Our Bouquets
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
