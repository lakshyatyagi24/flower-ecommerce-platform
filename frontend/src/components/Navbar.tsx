import React from "react";
import Logo from "./Logo";
import Link from "next/link";
import LocationSelector from "./LocationSelector";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-beige/40 backdrop-blur-md border-b border-olive-green/20 shadow-lg">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Logo />
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="#"
                className="text-olive-green hover:text-light-brown px-3 py-2 rounded-md text-sm font-medium border-b-2 border-transparent hover:border-olive-green"
              >
                Home
              </Link>
              <Link
                href="#"
                className="text-olive-green hover:text-light-brown px-3 py-2 rounded-md text-sm font-medium border-b-2 border-transparent hover:border-olive-green"
              >
                About
              </Link>
              <Link
                href="#"
                className="text-olive-green hover:text-light-brown px-3 py-2 rounded-md text-sm font-medium border-b-2 border-transparent hover:border-olive-green"
              >
                Contact
              </Link>
              <LocationSelector />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
