import React from 'react';
import Image from 'next/image';

const CurrencySelector = () => {
  return (
    <div className="flex items-center whitespace-nowrap">
      <Image src="/currency-icon.svg" alt="Currency" width={20} height={20} className="w-5 h-5 transition-transform hover:scale-110 flex-shrink-0" />
      <span className="ml-2 text-sm font-medium text-olive-green/90">INR</span>
    </div>
  );
};

export default CurrencySelector;
