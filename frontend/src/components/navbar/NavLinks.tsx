import React from 'react';
import Link from 'next/link';
import { NAV_LINKS } from '@/constants';

const NavLinks = () => {
  return (
    <div className="hidden md:flex items-center space-x-6">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className="text-brand-brown hover:text-brand-olive transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
};

export default NavLinks;
