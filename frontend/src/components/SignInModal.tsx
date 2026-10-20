"use client";
import React, { useRef, useState } from 'react';
import { useModal } from '@/components/chrome/use-modal';
import SignupModal from './SignupModal';
import ModalTopBar from './signin/ModalTopBar';
import SignInForm from './signin/SignInForm';
import { useSignIn } from './signin/use-signin';

type Props = {
  onClose: () => void;
};

function SignInIntro() {
  return (
    <>
      <h2 id="signin-title" className="font-display text-3xl text-charcoal">Welcome back</h2>
      <p id="signin-desc" className="mt-3 text-sm leading-relaxed text-stone-dark">
        Sign in to access your cart, orders, and event bookings.
      </p>
    </>
  );
}

const SignInModal: React.FC<Props> = ({ onClose }) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const state = useSignIn(onClose);

  // Focus trap, Escape, scroll lock and focus return are shared with the rest of the chrome.
  useModal(true, dialogRef, onClose);

  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };
  const backToSignIn = () => {
    setShowSignup(false);
    setTimeout(() => firstInputRef.current?.focus(), 0);
  };

  return (
    <div
      ref={overlayRef}
      onClick={onOverlayClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/50 sm:items-center sm:p-6"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={showSignup ? 'signup-title' : 'signin-title'}
        aria-describedby={showSignup ? undefined : 'signin-desc'}
        tabIndex={-1}
        className="max-h-[100dvh] w-full overflow-y-auto border border-stone-light bg-ivory px-5 pb-8 pt-6 outline-none sm:max-h-[calc(100dvh-3rem)] sm:max-w-[440px] sm:rounded-sm sm:px-10 sm:pb-10 sm:pt-8"
      >
        <ModalTopBar showBack={showSignup} onBack={backToSignIn} onClose={onClose} />
        {showSignup ? (
          <SignupModal onClose={onClose} />
        ) : (
          <>
            <SignInIntro />
            <SignInForm
              state={state}
              firstInputRef={firstInputRef}
              onClose={onClose}
              onShowSignup={() => setShowSignup(true)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SignInModal;
