"use client";
import React from "react";
import Link from "next/link";
import Logo from "./Logo";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 text-sm text-gray-700">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          <div className="flex-1">
            <Logo width={120} height={32} />
            <p className="mt-4 text-gray-600 max-w-md">
              Handcrafted floral arrangements, same-day delivery in many cities, and
              a happiness guarantee on every order.
            </p>

            <div className="mt-4">
              <form className="flex items-center max-w-sm" onSubmit={(e) => e.preventDefault()}>
                <label htmlFor="newsletter" className="sr-only">Subscribe to newsletter</label>
                <input
                  id="newsletter"
                  type="email"
                  placeholder="Your email"
                  className="w-full px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-olive-green/30"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-olive-green text-white rounded-r-md hover:opacity-95"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 flex-none">
            <div>
              <h4 className="font-semibold mb-3">Shop</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-olive-green">Flowers</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-olive-green">Bouquets</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-olive-green">Gifts</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-olive-green">FAQ</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-olive-green">Shipping</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-olive-green">Returns</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-olive-green">About us</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-olive-green">Careers</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-olive-green">Contact</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Flower Shop — All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-gray-600 hover:text-olive-green">Privacy</Link>
            <span className="hidden sm:inline">•</span>
            <Link href="#" className="text-gray-600 hover:text-olive-green">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
