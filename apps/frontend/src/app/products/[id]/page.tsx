"use client";
import { useParams, useRouter } from 'next/navigation';
import { useProducts } from '@/modules/products';
import { useCartContext } from '@/modules/cart/components/CartProvider';
import React, { useState } from 'react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { products, loading } = useProducts();
  const product = products.find((p) => p.id === params?.id);
  const { addToCart } = useCartContext();
  const [adding, setAdding] = useState(false);

  if (loading) {
    return <div className="text-center p-8">Loading product…</div>;
  }
  if (!product) {
    return <div className="text-center p-8">Product not found.</div>;
  }

  const handleAddToCart = () => {
    setAdding(true);
    addToCart({ product, quantity: 1 });
    setTimeout(() => {
      setAdding(false);
      router.push('/cart'); // Optionally redirect to cart or show a toast
    }, 500);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="rounded-lg overflow-hidden mb-4">
        <img src={product.image} alt={product.name} className="w-full object-cover" />
      </div>
      <h1 className="text-2xl font-serif mb-2">{product.name}</h1>
      <p className="mb-3">{product.description}</p>
      <div className="text-xl font-bold mb-4">₹ {product.price}</div>
      <button
        className="bg-brown-700 text-white px-6 py-2 rounded hover:bg-brown-800 transition"
        onClick={handleAddToCart}
        disabled={adding}
      >
        {adding ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}
