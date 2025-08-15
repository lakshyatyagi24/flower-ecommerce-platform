import React from 'react';
import Logo from './Logo';
import NavLinks from './NavLinks';
import ActionButtons from './ActionButtons';

const Navbar = () => {
  return (
    <nav className="bg-brand-beige text-brand-brown p-4 flex items-center justify-between">
      <Logo />
      <NavLinks />
      <ActionButtons />
    </nav>
  );
};

export default Navbar;
