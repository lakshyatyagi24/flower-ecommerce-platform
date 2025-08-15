import React from 'react';
import { NAV_LINKS } from '@/constants';
import Link from 'next/link';
import ActionButtons from './ActionButtons';

const MobileMenu = () => {
  return (
    <div className="absolute top-full left-0 w-full bg-brand-beige md:hidden z-10">
      <div className="flex flex-col items-center space-y-4 p-4">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className="text-brand-brown hover:text-brand-olive transition-colors"
          >
            {link.label}
          </Link>
        ))}
        <ActionButtons />
      </div>
    </div>
  );
};

export default MobileMenu;
