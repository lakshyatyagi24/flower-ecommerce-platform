import React from 'react';
import Link from 'next/link';
import { BRAND_TITLE } from '@/constants';

const Logo = () => {
  return (
    <Link href="/" className="font-serif text-2xl font-bold text-brand-brown">
      {BRAND_TITLE}
    </Link>
  );
};

export default Logo;
