'use client';
import Link from 'next/link';
import { useAuth } from '@/modules/auth';
import { useCartContext } from '@/modules/cart/components/CartProvider';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCartContext();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Nav links data for easy scalability
  const navLinks = [
    { href: '/products', text: 'Shop' },
    { href: '/about', text: 'About' },
    { href: '/contact', text: 'Contact' },
  ];

  return (
    <nav className="navbar sticky top-0 z-50 flex items-center justify-between py-6 px-4 md:px-10 bg-beige border-b border-olive-200 shadow-sm font-sans">
      <Link
        href="/"
        className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-primary hover:no-underline flex items-center gap-2"
      >
        <span aria-label="flower logo" className="text-accent text-2xl">
          ✿
        </span>
        Petal & Twine
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex gap-7 text-lg items-center">
        {navLinks.map((link) => (
          <Link
            href={link.href}
            key={link.href}
            className={`hover:underline text-primary ${
              pathname.startsWith(link.href) ? 'font-semibold underline underline-offset-4' : ''
            }`}
          >
            {link.text}
          </Link>
        ))}
        <Link href="/cart" className="flex items-center gap-1 text-primary relative">
          Cart
          {items.length > 0 && (
            <span className="bg-green-700 ml-1 text-white rounded-full px-2 py-0.5 text-xs absolute -top-3 left-9">
              {items.length}
            </span>
          )}
        </Link>
        {user ? (
          <>
            <span className="ml-4 hidden lg:inline">Hi, {user.name}</span>
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

      {/* Mobile Hamburger */}
      <button
        className="md:hidden p-2 text-primary rounded hover:bg-olive-200 focus:outline-none"
        aria-label="Open navigation menu"
        onClick={() => setMenuOpen((show) => !show)}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          {menuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
          )}
        </svg>
      </button>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-beige border-t border-olive-200 flex flex-col gap-4 py-5 px-6 md:hidden shadow-lg z-50">
          {navLinks.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              className={`py-1 text-lg font-medium text-primary hover:text-accent ${
                pathname.startsWith(link.href) ? 'font-semibold underline underline-offset-4' : ''
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {link.text}
            </Link>
          ))}
          <Link
            href="/cart"
            className="flex items-center gap-1 text-primary"
            onClick={() => setMenuOpen(false)}
          >
            Cart
            {items.length > 0 && (
              <span className="bg-green-700 ml-1 text-white rounded-full px-2 py-0.5 text-xs">
                {items.length}
              </span>
            )}
          </Link>
          {user ? (
            <button
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="text-accent text-left mt-2"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="text-accent" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
