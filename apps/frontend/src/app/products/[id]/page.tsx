'use client';
import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import Image from 'next/image';

export default function ProductDetailPage() {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = () => {
    setAdding(true);
    setTimeout(() => {
      setAdding(false);
      router.push('/cart'); // Optionally redirect to cart or show a toast
    }, 500);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
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
