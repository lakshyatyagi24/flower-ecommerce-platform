"use client";
import React, { useEffect, useRef, useState } from 'react';
type Props = {
  onClose: () => void;
  onBackToSignIn: () => void;
};

const SignupModal: React.FC<Props> = ({ onClose, onBackToSignIn }) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    firstInputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to backend registration endpoint
    console.debug('signup', { name, email, password });
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={onOverlayClick}
      className="w-full"
    >
      <div className="p-2">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={onBackToSignIn} className="text-olive-green hover:underline">← Back</button>
          <button onClick={onClose} aria-label="Close" className="text-olive-green/70 hover:text-olive-green">×</button>
        </div>

        <h4 className="text-lg font-semibold text-olive-green mb-2">Create your account</h4>

        <form onSubmit={handleSignup} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full name</label>
            <input ref={firstInputRef} type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
          </div>

          <div>
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-black px-4 py-2 text-sm font-medium bg-white hover:bg-olive-green/5">Create account</button>
          </div>
        </form>

        <div className="mt-3 text-sm text-center text-gray-600">By creating an account you agree to our <a href="/terms" className="text-olive-green hover:underline">terms</a>.</div>
      </div>
    </div>
  );
};

export default SignupModal;
