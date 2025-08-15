'use client';
import React from 'react';
import { useCartStore } from '@/store/cart';
import {
  SEARCH_PLACEHOLDER,
  TRACK_ORDER,
  CURRENCY,
  LOGIN,
  LOGOUT,
} from '@/constants';
import { useSession, signIn, signOut } from 'next-auth/react';

const ActionButtons = () => {
  const { data: session } = useSession();
  const cartCount = useCartStore((state) => state.cartCount);

  return (
    <div className="flex items-center space-x-4">
      {/* Search Bar */}
      <div>
        <input
          type="text"
          placeholder={SEARCH_PLACEHOLDER}
          className="bg-white border border-brand-brown rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-olive"
        />
      </div>

      {/* Track Order */}
      <button className="text-brand-brown hover:text-brand-olive transition-colors">
        {/* TODO: Add Track Order Icon */}
        {TRACK_ORDER}
      </button>

      {/* Shopping Cart */}
      <button className="relative">
        {/* TODO: Add Shopping Cart Icon */}
        Cart
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {cartCount}
        </span>
      </button>

      {/* Currency */}
      <div>{CURRENCY}</div>

      {/* User Auth */}
      {session ? (
        <button
          onClick={() => signOut()}
          className="bg-brand-olive text-white px-4 py-2 rounded-full hover:bg-brand-brown transition-colors"
        >
          {LOGOUT}
        </button>
      ) : (
        <button
          onClick={() => signIn()}
          className="bg-brand-olive text-white px-4 py-2 rounded-full hover:bg-brand-brown transition-colors"
        >
          {LOGIN}
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
