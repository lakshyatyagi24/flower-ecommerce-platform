"use client";
import React, { useState } from "react";
import Logo from "./Logo";
import Link from "next/link";
import Image from "next/image";
import LocationSelector from "./LocationSelector";
import SearchBar from "./SearchBar";
import Cart from "./Cart";
import CurrencySelector from "./CurrencySelector";
import UserSignIn from "./UserSignIn";
import Categories from "./Categories";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="navbar w-full" aria-label="Primary">
        <div className="navbar-inner max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between w-full">
            <div className="flex-none">
              <Logo />
            </div>

            <div className="hidden md:flex items-center justify-center flex-1 gap-x-12">
              <ul className="flex items-center gap-x-6" role="menubar" aria-label="Primary pages">
                <li role="none"><Link href="/" role="menuitem" className="nav-link px-2 py-1 rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40">Home</Link></li>
                <li role="none"><Link href="/about" role="menuitem" className="nav-link px-2 py-1 rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40">About</Link></li>
                <li role="none"><Link href="/contact" role="menuitem" className="nav-link px-2 py-1 rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40">Contact</Link></li>
              </ul>

              <div className="max-w-lg w-full">
                <div className="search-input">
                  <SearchBar />
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-x-4 flex-none">
              <div className="flex items-center gap-x-3 whitespace-nowrap">
                <Link href="/track-order" className="flex items-center text-olive-green/80 hover:text-olive-green px-2 py-1 rounded-md text-sm font-medium whitespace-nowrap flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40" aria-label="Track Order">
                  <Image src="/track-order-icon.svg" alt="Track Order" width={20} height={20} className="w-5 h-5 mr-2 transition-transform hover:scale-110"/>
                  <span className="hidden md:inline">{'Track\u00A0Order'}</span>
                </Link>
                <div className="flex items-center text-olive-green">
                  <Cart />
                </div>
                <div className="flex items-center text-olive-green/70">
                  <CurrencySelector />
                </div>
                <div className="flex items-center">
                  <UserSignIn />
                </div>
                <div className="h-6 w-px bg-olive-green/20 mx-3" aria-hidden />
                <div className="flex items-center min-w-[170px]">
                  <LocationSelector />
                </div>
              </div>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-olive-green hover:text-light-brown hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Toggle navigation menu"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

  {isMobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3" role="menu" aria-label="Mobile primary">
              <div className="mb-2">
                <SearchBar />
              </div>
              <Link href="/" role="menuitem" className="text-olive-green hover:text-light-brown block px-3 py-2 rounded-md text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40">Home</Link>
              <Link href="/about" role="menuitem" className="text-olive-green hover:text-light-brown block px-3 py-2 rounded-md text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40">About</Link>
              <Link href="/contact" role="menuitem" className="text-olive-green hover:text-light-brown block px-3 py-2 rounded-md text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40">Contact</Link>
              <Link href="/track-order" role="menuitem" className="flex items-center text-olive-green hover:text-light-brown px-3 py-2 rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40" aria-label="Track Order mobile">
                <Image src="/track-order-icon.svg" alt="Track Order" width={20} height={20} className="mr-2"/>
                Track Order
              </Link>
              <Cart />
              <CurrencySelector />
              <UserSignIn />
            </div>
            <div className="px-2 pt-2 pb-3">
              <LocationSelector />
            </div>
          </div>
        )}

  <Categories />
      </nav>

      {/* spacer to offset sticky navbar + categories so page content isn't hidden */}
      <div className="nav-spacer" aria-hidden />
    </>
  );
};

export default Navbar;
