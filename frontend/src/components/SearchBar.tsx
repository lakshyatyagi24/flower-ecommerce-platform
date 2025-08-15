import React from "react";
import Image from "next/image";

const SearchBar = () => {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Image
          src="/search-icon.svg"
          alt="Search"
          width={20}
          height={20}
          className="text-gray-400"
        />
      </div>
      <input
        type="text"
        placeholder="Search for products..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-olive-green/50"
      />
    </div>
  );
};

export default SearchBar;
