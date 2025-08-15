import React from 'react';
import { SEARCH_PLACEHOLDER } from '@/constants';

const SearchInput = () => {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={SEARCH_PLACEHOLDER}
        className="px-4 py-2 border-1 border-black rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-olive"
      />
      {/* TODO: Add a search icon inside the input */}
    </div>
  );
};

export default SearchInput;
