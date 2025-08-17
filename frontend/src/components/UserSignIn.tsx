import React from 'react';
import Image from 'next/image';

const UserSignIn = () => {
  return (
  <button className="flex items-center text-olive-green hover:text-light-brown px-2 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap">
      <Image src="/user-icon.svg" alt="Sign In" width={20} height={20} className="w-5 h-5 mr-2 transition-transform hover:scale-110 flex-shrink-0" />
  <span className="whitespace-nowrap">{'Sign\u00A0In'}</span>
    </button>
  );
};

export default UserSignIn;
