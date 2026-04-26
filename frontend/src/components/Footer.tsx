"use client";

import React from "react";
import Link from "next/link";
import Logo from "./Logo";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-[#f9f5ef] to-[#f2e6d9] border-t border-olive-green/10 text-sm text-gray-700 mt-16">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          <div className="flex-1">
            <Logo width={150} height={42} />
            <p className="mt-4 text-gray-700 max-w-md leading-relaxed">
              Fresh Petals India brings farm-sourced flowers, dependable delivery, and event-focused floral support with live catalog sync.
            </p>

            <div className="mt-6 p-4 bg-white/70 border border-olive-green/10 rounded-2xl shadow-sm max-w-md">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase text-olive-green">Client care</p>
              <p className="mt-2 text-base font-semibold text-olive-green">+91 93113 11195</p>
              <p className="text-sm text-gray-600">support@freshpetalsindia.com</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gray-500">
                Same-day delivery in major cities
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 flex-none min-w-[300px]">
            <div>
              <h4 className="font-semibold mb-3 text-olive-green uppercase tracking-wide text-xs">Shop</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/products" className="text-gray-700 hover:text-olive-green">
                    All products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products?category=cut-flowers"
                    className="text-gray-700 hover:text-olive-green"
                  >
                    Cut flowers
                  </Link>
                </li>
                <li>
                  <Link href="/track-order" className="text-gray-700 hover:text-olive-green">
                    Track order
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-olive-green uppercase tracking-wide text-xs">Support</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/faq" className="text-gray-700 hover:text-olive-green">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-700 hover:text-olive-green">
                    Contact us
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-700 hover:text-olive-green">
                    About us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-olive-green uppercase tracking-wide text-xs">Connect</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="https://theflora.in"
                    className="text-gray-700 hover:text-olive-green"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source catalog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-700 hover:text-olive-green">
                    Event inquiry
                  </Link>
                </li>
                <li>
                  <Link href="/search" className="text-gray-700 hover:text-olive-green">
                    Search
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-olive-green/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Fresh Petals India. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-gray-600">
            <Link href="/faq" className="hover:text-olive-green">
              Help
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link href="/contact" className="hover:text-olive-green">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
