"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SignInModal from './SignInModal';
import { useAuth } from '@/lib/auth-context';

const UserSignIn = () => {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  if (loading) {
    return (
      <span className="text-olive-green/60 text-sm px-2">…</span>
    );
  }

  if (user) {
    const label = user.name?.split(' ')[0] || user.email.split('@')[0];
    return (
      <div className="relative">
        <button
          ref={triggerRef}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center text-olive-green hover:text-light-brown px-2 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <Image src="/user-icon.svg" alt="" width={20} height={20} className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="whitespace-nowrap">Hi, {label}</span>
        </button>
        {menuOpen && (
          <div
            ref={menuRef}
            role="menu"
            className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-olive-green/10 py-1 z-50"
          >
            <div className="px-4 py-2 text-xs text-olive-green/70 border-b border-olive-green/10 truncate">
              {user.email}
            </div>
            <Link href="/account/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-olive-green/5">
              My orders
            </Link>
            <button
              type="button"
              onClick={() => { logout(); setMenuOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

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
        <span className="whitespace-nowrap">{'Sign In'}</span>
      </button>

      {open && (
        <SignInModal
          onClose={() => {
            setOpen(false);
            setTimeout(() => triggerRef.current?.focus(), 0);
          }}
        />
      )}
    </>
  );
};

export default UserSignIn;
