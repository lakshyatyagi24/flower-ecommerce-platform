import React from "react";
import Image from "next/image";

// Accessible search with proper form semantics & hidden label
const SearchBar = () => {
  const id = "global-search";
  return (
    <form role="search" aria-label="Site" className="relative w-full max-w-md" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor={id} className="sr-only">Search products</label>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Image src="/search-icon.svg" alt="" aria-hidden width={20} height={20} className="text-gray-400" />
      </div>
      <input
        id={id}
        type="search"
        inputMode="search"
        placeholder="Search flowers, cakes, gifts..."
        autoComplete="off"
        className="w-full pl-10 pr-4 h-10 bg-white/80 border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-olive-green/50 placeholder:text-gray-400"
      />
    </form>
  );
};

export default SearchBar;
