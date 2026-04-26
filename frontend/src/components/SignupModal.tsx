"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

type Props = {
  onClose: () => void;
  onBackToSignIn: () => void;
};

const SignupModal: React.FC<Props> = ({ onClose, onBackToSignIn }) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!email || !password) {
      setAlert({ type: 'error', message: 'Email and password are required' });
      return;
    }
    if (password.length < 6) {
      setAlert({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }
    setSubmitting(true);
    try {
      await register({ email, password, name: name || undefined, phone: phone || undefined });
      setAlert({ type: 'success', message: 'Account created. Welcome!' });
      setTimeout(() => onClose(), 600);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Sign up failed';
      setAlert({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={overlayRef} onClick={onOverlayClick} className="w-full">
      <div className="p-2">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={onBackToSignIn} className="text-olive-green hover:underline">← Back</button>
          <button onClick={onClose} aria-label="Close" className="text-olive-green/70 hover:text-olive-green">×</button>
        </div>

        <h4 className="text-lg font-semibold text-olive-green mb-2">Create your account</h4>

        {alert && (
          <div className={`mb-3 px-3 py-2 rounded text-sm ${alert.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`} role="alert" aria-live="assertive">
            {alert.message}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full name</label>
            <input ref={firstInputRef} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone (optional)</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 99999 11111" className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40" />
          </div>

          <div>
            <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-black px-4 py-2 text-sm font-medium bg-white hover:bg-olive-green/5 disabled:bg-gray-100 disabled:text-gray-400">
              {submitting ? 'Creating...' : 'Create account'}
            </button>
          </div>
        </form>

        <div className="mt-3 text-sm text-center text-gray-600">By creating an account you agree to our <a href="/terms" className="text-olive-green hover:underline">terms</a>.</div>
      </div>
    </div>
  );
};

export default SignupModal;
