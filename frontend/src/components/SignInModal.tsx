"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import SignupModal from './SignupModal';
import Tooltip from './Tooltip';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FocusTrap from 'focus-trap-react';

type Props = {
  onClose: () => void;
};

const SignInModal: React.FC<Props> = ({ onClose }) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const router = useRouter();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const MAX_ATTEMPTS = 5;
  const LOCK_MINUTES = 15;

  const makeKey = (e: string) => `signin_fail_${e.toLowerCase()}`;

  const getAttemptRecord = (e: string) => {
    try {
      const v = sessionStorage.getItem(makeKey(e));
      return v ? JSON.parse(v) as { count: number; lockUntil?: number } : { count: 0 };
    } catch {
      return { count: 0 };
    }
  };

  const getRemainingAttempts = (e: string) => {
    const rec = getAttemptRecord(e);
    return Math.max(0, MAX_ATTEMPTS - (rec.count || 0));
  };

  const setAttemptRecord = (e: string, rec: { count: number; lockUntil?: number }) => {
    try {
      sessionStorage.setItem(makeKey(e), JSON.stringify(rec));
    } catch {}
  };

  const incrementFailed = (e: string) => {
    const rec = getAttemptRecord(e);
    rec.count = (rec.count || 0) + 1;
    if (rec.count >= MAX_ATTEMPTS) {
      rec.lockUntil = Date.now() + LOCK_MINUTES * 60 * 1000;
    }
    setAttemptRecord(e, rec);
    return rec;
  };

  const isLocked = (e: string) => {
    const rec = getAttemptRecord(e);
    if (rec.lockUntil && rec.lockUntil > Date.now()) return rec.lockUntil;
    return 0;
  };

  useEffect(() => {
    // focus first input when opened
    firstInputRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ...existing code...

  // focus trap handled by focus-trap-react wrapper around modal content

  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const validateEmail = (v: string) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    setEmailError(ok ? null : 'Please enter a valid email address');
    return ok;
  };

  const validatePassword = (v: string) => {
    // minimal complexity: 8 chars, one letter and one number
    const ok = /(?=.{8,})(?=.*[A-Za-z])(?=.*\d)/.test(v);
    setPasswordError(ok ? null : 'Password must be 8+ characters and include letters and numbers');
    return ok;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    // lockout check
    const lockUntil = isLocked(email || 'guest');
    if (lockUntil && lockUntil > Date.now()) {
      const mins = Math.ceil((lockUntil - Date.now()) / 60000);
      setAlert({ type: 'error', message: `Too many failed attempts. Try again in ${mins} minute(s).` });
      return;
    }

    const validEmail = validateEmail(email);
    const validPassword = validatePassword(password);
    if (!validEmail || !validPassword) return;

    // call NextAuth signIn
    const res = await signIn('credentials', { redirect: false, email, password });
    // NextAuth returns an object when redirect false; handle common shapes
  if (res && (res.error || res.status === 401)) {
      // failed
      incrementFailed(email || 'guest');
      setAlert({ type: 'error', message: res.error || 'Invalid email or password' });
    } else {
  // clear attempt record for this email on success
  try { sessionStorage.removeItem(makeKey(email || 'guest')); } catch {}
      // success — redirect
      const getRedirectTarget = () => {
        try {
          const params = new URLSearchParams(window.location.search);
          const cb = params.get('callbackUrl') || params.get('redirect');
          if (cb) return cb;
        } catch {}
        try {
          const stored = sessionStorage.getItem('post_signin_redirect');
          if (stored) return stored;
        } catch {}
        return '/';
      };

      const target = getRedirectTarget() || '/';
      try { sessionStorage.removeItem('post_signin_redirect'); } catch {}
      setAlert({ type: 'success', message: 'Signed in — redirecting...' });
      setTimeout(() => {
        onClose();
        router.push(target);
      }, 600);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={onOverlayClick}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-title"
      aria-describedby="signin-desc"
    >
      <FocusTrap focusTrapOptions={{
        clickOutsideDeactivates: true,
        // initialFocus can be an element or function returning element
        initialFocus: () => firstInputRef.current as HTMLElement | null,
        // when deactivated, return focus to the element that had it before trap
        returnFocusOnDeactivate: true,
      }}>
        <div ref={modalRef} className="relative w-full max-w-md sm:max-w-lg bg-white rounded-lg shadow-lg border border-olive-green/10 overflow-hidden mx-2">
        {/* floral corner accent */}
        <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 pointer-events-none">
          <Image src="/autumn-rustic-banner.svg" alt="floral" width={120} height={120} className="opacity-90" />
        </div>

        <div className="p-6">
              <div className="flex items-center justify-between mb-2">
            <div>
              <h3 id="signin-title" className="text-lg font-semibold text-olive-green">Welcome back</h3>
              <p id="signin-desc" className="text-xs text-gray-500 mt-1 inline">Sign in to access your cart, orders, and event bookings.</p>
              <div className="mt-1 text-xs text-gray-500 relative">
                <span>Your information is secure.</span>
                <Tooltip triggerLabel={<span className="ml-2 text-olive-green hover:underline text-xs">Why?</span>}>
                  <div className="mb-2">We protect your account with industry-standard encryption. After several failed sign-in attempts we temporarily lock this form locally to deter attackers. Passwords are never stored in plain text.</div>
                  <div>
                    <a href="/contact" className="text-olive-green hover:underline">Contact support</a> if you need help.
                  </div>
                </Tooltip>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close sign in dialog"
              className="text-olive-green/70 hover:text-olive-green ml-4 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-olive-green/40"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              ×
            </button>
          </div>

          {!showSignup ? (
            <>
              {alert && (
                <div className={`mb-3 px-3 py-2 rounded text-sm ${alert.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`} role="alert" aria-live="assertive">
                  {alert.message}
                </div>
              )}

              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    id="signin-email"
                    ref={firstInputRef}
                    type="email"
                    required
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'signin-email-error signin-desc' : 'signin-desc'}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); validateEmail(e.target.value); }}
                    placeholder="you@example.com"
                    className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40"
                  />
                  {emailError && <div id="signin-email-error" className="mt-1 text-sm text-red-600">{emailError}</div>}
                </div>

                <div>
                  <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1 relative">
                    <input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? 'signin-password-error signin-desc' : 'signin-desc'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); }}
                      placeholder="Enter your password"
                      className="w-full rounded-md border-gray-200 shadow-sm pr-10 focus:ring-2 focus:ring-olive-green/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-olive-green/80 inline-flex items-center justify-center"
                      style={{ minWidth: 44, minHeight: 44 }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-right">
                    <a href="/forgot-password" className="text-olive-green hover:underline" aria-label="Forgot password">Forgot Password?</a>
                  </div>
                  {passwordError && <div id="signin-password-error" className="mt-1 text-sm text-red-600">{passwordError}</div>}
                  {/* attempts / lockout info */}
                  <div className="mt-2 text-sm" aria-live="polite">
                    {(() => {
                      const key = (email || 'guest');
                      const lock = isLocked(key);
                      const locked = !!(lock && lock > Date.now());
                      if (locked) {
                        const ms = (lock as number) - Date.now();
                        const mins = Math.floor(ms / 60000);
                        const secs = Math.ceil((ms % 60000) / 1000);
                        return (
                          <div id="signin-lockout" className="text-sm text-red-600">Too many failed attempts. Try again in {mins} min {secs}s.</div>
                        );
                      }
                      const left = getRemainingAttempts(key);
                      return <div className="text-gray-500">{left > 0 ? `${left} attempt${left === 1 ? '' : 's'} remaining` : 'You have no attempts remaining'}</div>;
                    })()}
                  </div>
                </div>

                <div>
                  {(() => {
                    const lock = isLocked(email || 'guest');
                    const disabled = !!(lock && lock > Date.now());
                    return (
                      <button
                        type="submit"
                        disabled={disabled}
                        aria-label="Sign in"
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-md border border-black px-4 py-3 sm:py-3 text-sm font-medium ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-olive-green/5'}`}
                        style={{ minHeight: 48 }}
                      >
                        Sign In
                      </button>
                    );
                  })()}
                </div>
              </form>

              {/* Inline onboarding shortcut for new users - now opens signup modal */}
              <div className="mt-3 text-sm text-gray-600">
                Don&apos;t have an account? <button type="button" onClick={() => setShowSignup(true)} className="text-olive-green hover:underline">Create one</button>
              </div>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px bg-gray-200 flex-1" />
                <div className="text-sm text-gray-500">or</div>
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              <div>
                <button
                  onClick={() => {
                    // pass callbackUrl if present
                    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
                    const cb = params ? params.get('callbackUrl') || params.get('redirect') : null;
                    signIn('google', { callbackUrl: cb || '/' });
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 px-4 py-3 sm:py-2 text-sm font-medium bg-white hover:bg-gray-50"
                >
                  <Image src="/google.svg" alt="Google" width={18} height={18} />
                  Continue with Google
                </button>
              </div>

              {/* compact bottom prompt duplicated for visibility */}
              <div className="mt-4 text-center text-sm text-gray-600">
                Don&apos;t have an account? <button type="button" onClick={() => setShowSignup(true)} className="text-olive-green hover:underline">Create one</button>
              </div>
            </>
          ) : (
            <SignupModal
              onClose={onClose}
              onBackToSignIn={() => {
                setShowSignup(false);
                setTimeout(() => firstInputRef.current?.focus(), 0);
              }}
            />
          )}
        </div>
        </div>
      </FocusTrap>
    </div>
  );
};

export default SignInModal;
