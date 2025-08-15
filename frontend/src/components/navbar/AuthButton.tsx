'use client';

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { LOGIN, LOGOUT } from '@/constants';

const AuthButton = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        className="px-4 py-2 border-1 border-black rounded-full bg-brand-olive text-white hover:bg-brand-brown transition-colors"
      >
        {LOGOUT}
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="px-4 py-2 border-1 border-black rounded-full bg-brand-olive text-white hover:bg-brand-brown transition-colors"
    >
      {LOGIN}
    </button>
  );
};

export default AuthButton;
