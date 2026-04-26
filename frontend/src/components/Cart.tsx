"use client";
import React from 'react';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';

const Cart = () => {
  const { count, open } = useCart();
  return (
    <button
      type="button"
      onClick={open}
      aria-label={count ? `Cart with ${count} items` : 'Cart is empty'}
      className="relative flex items-center flex-shrink-0 text-olive-green/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40 rounded-md p-1"
    >
      <Image src="/cart-icon.svg" alt="" aria-hidden width={20} height={20} className="w-5 h-5 transition-transform hover:scale-110 flex-shrink-0" />
      <span className="sr-only">Cart</span>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
};

export default Cart;
