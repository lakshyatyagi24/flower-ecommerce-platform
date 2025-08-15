import React from 'react';
import Image from 'next/image';

const Cart = () => {
  const itemCount = 0;

  return (
    <div className="relative flex items-center">
      <Image src="/cart-icon.svg" alt="Cart" width={24} height={24} />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
          {itemCount}
        </span>
      )}
      {itemCount === 0 && (
          <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
            0
          </span>
      )}
    </div>
  );
};

export default Cart;
