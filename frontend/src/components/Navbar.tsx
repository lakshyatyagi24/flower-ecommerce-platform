"use client";
import React, { useState } from "react";
import Logo from "./Logo";
import Link from "next/link";
import LocationSelector from "./LocationSelector";
import SearchBar from "./SearchBar";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-beige/40 backdrop-blur-md border-b border-olive-green/20 shadow-lg">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left Section */}
          <div className="flex-1 flex items-center">
            <Logo />
          </div>

          {/* Center Section */}
          <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-center">
            <div className="hidden md:block w-full max-w-md">
              <SearchBar />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex-1 flex items-center justify-end">
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <Link href="#" className="text-olive-green hover:text-light-brown px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                <Link href="#" className="text-olive-green hover:text-light-brown px-3 py-2 rounded-md text-sm font-medium">About</Link>
                <Link href="#" className="text-olive-green hover:text-light-brown px-3 py-2 rounded-md text-sm font-medium">Contact</Link>
              </div>
              <LocationSelector />
            </div>
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-olive-green hover:text-light-brown hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-expanded="false"
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
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div className="mb-2">
              <SearchBar />
            </div>
            <Link href="#" className="text-olive-green hover:text-light-brown block px-3 py-2 rounded-md text-base font-medium">Home</Link>
            <Link href="#" className="text-olive-green hover:text-light-brown block px-3 py-2 rounded-md text-base font-medium">About</Link>
            <Link href="#" className="text-olive-green hover:text-light-brown block px-3 py-2 rounded-md text-base font-medium">Contact</Link>
          </div>
          <div className="px-2 pt-2 pb-3">
            <LocationSelector />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
