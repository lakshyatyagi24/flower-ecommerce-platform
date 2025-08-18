"use client";
import React, { useRef, useState } from 'react';
import Image from 'next/image';
import SignInModal from './SignInModal';

const UserSignIn = () => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="flex items-center text-olive-green hover:text-light-brown px-2 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Image src="/user-icon.svg" alt="Sign In" width={20} height={20} className="w-5 h-5 mr-2 transition-transform hover:scale-110 flex-shrink-0" />
        <span className="whitespace-nowrap">{'Sign\u00A0In'}</span>
      </button>

      {open && (
        <SignInModal
          onClose={() => {
            setOpen(false);
            // restore focus to trigger
            setTimeout(() => triggerRef.current?.focus(), 0);
          }}
        />
      )}
    </>
  );
};

export default UserSignIn;
