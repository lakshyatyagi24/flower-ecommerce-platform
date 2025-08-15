import React from 'react';
import Image from 'next/image';

const CurrencySelector = () => {
  return (
    <div className="flex items-center">
      <Image src="/currency-icon.svg" alt="Currency" width={24} height={24} className="transition-transform hover:scale-110" />
      <span className="ml-2 text-sm font-medium text-olive-green">INR</span>
    </div>
  );
};

export default CurrencySelector;
