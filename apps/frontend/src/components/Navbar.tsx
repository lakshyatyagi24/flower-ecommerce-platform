'use client';
import Link from 'next/link';
import { useState } from 'react';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import { HiMenu, HiX } from 'react-icons/hi';
import clsx from 'clsx';

const NAV_LINKS = [
  { href: '/products', label: 'Shop' },
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact Us' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header>
      <nav className="bg-beige border-b border-olive-200 px-4 py-4 flex items-center justify-between shadow-md z-[100] fixed top-0 left-0 w-full backdrop-blur-lg bg-opacity-40">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center font-serif text-2xl font-bold tracking-tight text-brown-800 gap-2"
        >
          <span aria-label="flower logo" className="text-accent text-2xl">
            ✿
          </span>
          Petal & Twine
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-primary hover:text-accent font-semibold transition"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/cart" aria-label="Cart" className="ml-3">
            <FaShoppingCart className="w-5 h-5 text-accent hover:text-primary" />
          </Link>
          <Link href="/login" aria-label="Account" className="ml-2">
            <FaUser className="w-5 h-5 text-brown-800 hover:text-accent" />
          </Link>
        </div>

        {/* Hamburger for mobile */}
        <button
          className="md:hidden text-brown-800 p-2 rounded focus:outline-none focus:ring"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
        >
          <HiMenu className="w-7 h-7" />
        </button>
      </nav>

      {/* Slide-in Mobile Menu */}
      <aside
        className={clsx(
          'fixed top-0 left-0 w-72 h-full bg-beige shadow-2xl border-r border-olive-200 z-[999] flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-olive-200">
          <Link
            href="/"
            className="flex items-center font-serif text-xl font-bold tracking-tight text-brown-800 gap-2"
            onClick={() => setOpen(false)}
          >
            <span className="text-accent text-xl">✿</span> Petal & Twine
          </Link>
          <button
            className="text-primary p-1"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <HiX className="w-7 h-7" />
          </button>
        </div>
        <ul className="flex-1 flex flex-col gap-1 mt-5 ml-2">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block px-7 py-3 text-lg font-semibold text-brown-800 rounded hover:bg-accent/10"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex gap-4 px-7 pb-6 mt-auto">
          <Link href="/cart" aria-label="Cart" className="block">
            <FaShoppingCart className="w-6 h-6 text-accent" />
          </Link>
          <Link href="/login" aria-label="Account" className="block">
            <FaUser className="w-6 h-6 text-brown-800" />
          </Link>
        </div>
      </aside>

      {/* Overlay when menu is open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-[900] md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Spacer for sticky/fixed nav */}
      <div className="h-20 md:h-20"></div>
    </header>
  );
}
