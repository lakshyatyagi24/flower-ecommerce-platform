import React from 'react';
import Logo from './Logo';
import NavLinks from './NavLinks';
import SearchInput from './SearchInput';
import CartButton from './CartButton';
import AuthButton from './AuthButton';

const Navbar = () => {
  return (
    <header className="bg-brand-beige text-brand-brown p-4">
      <nav className="container mx-auto flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* Center: NavLinks */}
        <div className="hidden md:flex justify-center flex-grow">
          <NavLinks />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-4">
          <SearchInput />
          <CartButton />
          <AuthButton />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
