'use client';
import Link from 'next/link';
import { useAuth } from '@/modules/auth';
import { useCartContext } from '@/modules/cart/components/CartProvider';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCartContext();

  return (
    <nav className="navbar flex items-center justify-between py-6 px-12 border-b font-sans">
      <span className="font-serif text-2xl font-bold text-brown-800">Rustic Blooms</span>
      <div className="flex gap-7 text-lg items-center">
        <Link href="/products" className="hover:underline text-brown-800">
          Products
        </Link>
        <Link href="/events" className="hover:underline text-brown-800">
          Events
        </Link>
        <Link href="/cart" className="flex items-center gap-1 text-brown-800">
          Cart
          <span className="bg-green-700 ml-1 text-white rounded-full px-2 text-xs">
            {items.length}
          </span>
        </Link>
        {user ? (
          <>
            <span className="ml-4">Hi, {user.name}</span>
            <button onClick={logout} className="ml-2 text-accent hover:underline">
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="text-accent hover:underline">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
