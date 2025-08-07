'use client';
import Link from 'next/link';
import { useAuth } from '@/modules/auth';
import { useCartContext } from '@/modules/cart/components/CartProvider';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCartContext();
  const pathname = usePathname();

  return (
    <nav className="navbar flex items-center justify-between py-6 px-4 md:px-10 bg-beige border-b border-olive-200 shadow-sm font-sans">
      {/* Brand Logo/Name */}
      <Link
        href="/"
        className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-primary hover:no-underline flex items-center gap-2"
      >
        <span aria-label="flower logo" className="text-accent text-2xl">
          ✿
        </span>
        Petal & Twine
      </Link>
      {/* Nav Links */}
      <div className="flex gap-6 md:gap-10 text-base md:text-lg items-center">
        <Link
          href="/products"
          className={`hover:underline text-primary ${pathname.startsWith('/products') ? 'font-semibold underline underline-offset-4' : ''}`}
        >
          Shop
        </Link>
        <Link
          href="/about"
          className={`hover:underline text-primary ${pathname === '/about' ? 'font-semibold underline underline-offset-4' : ''}`}
        >
          About
        </Link>
        <Link
          href="/contact"
          className={`hover:underline text-primary ${pathname === '/contact' ? 'font-semibold underline underline-offset-4' : ''}`}
        >
          Contact
        </Link>
        <Link href="/cart" prefetch className="flex items-center gap-1 text-primary relative">
          Cart
          {items.length > 0 && (
            <span className="bg-green-700 ml-1 text-white rounded-full px-2 py-0.5 text-xs absolute -top-3 left-9">
              {items.length}
            </span>
          )}
        </Link>
        {user ? (
          <>
            <span className="hidden md:inline ml-4">Hi, {user.name}</span>
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
