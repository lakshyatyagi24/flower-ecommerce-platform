import React from 'react';
import Image from 'next/image';

const UserSignIn = () => {
  return (
    <button className="flex items-center text-olive-green hover:text-light-brown px-3 py-2 rounded-md text-sm font-medium">
      <Image src="/user-icon.svg" alt="Sign In" width={24} height={24} className="mr-2 transition-transform hover:scale-110" />
      Sign In
    </button>
  );
};

export default UserSignIn;
