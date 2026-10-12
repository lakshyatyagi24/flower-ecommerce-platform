"use client";
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';
import { safeRedirect } from '@/lib/safe-redirect';
import { useModal } from '@/components/chrome/use-modal';
import { AuthMessage } from '@/components/account/AuthLayout';
import SignupModal from './SignupModal';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Input, { PasswordInput } from '@/components/ui/Input';
import { textLink } from '@/components/ui/form-styles';

type Props = {
  onClose: () => void;
};

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const SignInModal: React.FC<Props> = ({ onClose }) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Focus trap, Escape, scroll lock and focus return are shared with the rest of the chrome.
  useModal(true, dialogRef, onClose);

  const makeKey = (e: string) => `signin_fail_${e.toLowerCase()}`;

  const getAttemptRecord = (e: string) => {
    try {
      const v = sessionStorage.getItem(makeKey(e));
      const rec = v ? (JSON.parse(v) as { count: number; lockUntil?: number }) : { count: 0 };
      // Once a lock window has elapsed, grant a fresh set of attempts instead of
      // leaving count pinned at MAX (which permanently showed "no attempts
      // remaining" and re-locked on the very next failure).
      if (rec.lockUntil && rec.lockUntil <= Date.now()) {
        return { count: 0 };
      }
      return rec;
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

  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const validateEmail = (v: string) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    setEmailError(ok ? null : 'Please enter a valid email address');
    return ok;
  };

  const validatePassword = (v: string) => {
    const ok = v.length >= 6;
    setPasswordError(ok ? null : 'Password must be at least 6 characters');
    return ok;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const lockUntil = isLocked(email || 'guest');
    if (lockUntil && lockUntil > Date.now()) {
      const mins = Math.ceil((lockUntil - Date.now()) / 60000);
      setAlert({ type: 'error', message: `Too many failed attempts. Try again in ${mins} minute(s).` });
      return;
    }

    const validEmail = validateEmail(email);
    const validPassword = validatePassword(password);
    if (!validEmail || !validPassword) return;

    setSubmitting(true);
    try {
      await login(email, password);
      try { sessionStorage.removeItem(makeKey(email || 'guest')); } catch {}
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
        return null;
      };
      const target = safeRedirect(getRedirectTarget());
      try { sessionStorage.removeItem('post_signin_redirect'); } catch {}
      setAlert({ type: 'success', message: 'Signed in — welcome back.' });
      setTimeout(() => {
        onClose();
        if (target) router.push(target);
      }, 500);
    } catch (err) {
      incrementFailed(email || 'guest');
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Sign in failed';
      setAlert({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const lockKey = email || 'guest';
  const lock = isLocked(lockKey);
  const locked = !!(lock && lock > Date.now());
  const left = getRemainingAttempts(lockKey);

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
        <div className="flex items-start justify-between gap-4">
          {showSignup ? (
            <button
              type="button"
              onClick={() => {
                setShowSignup(false);
                setTimeout(() => firstInputRef.current?.focus(), 0);
              }}
              className={`-ml-3 inline-flex min-h-[44px] items-center px-3 text-xs font-medium uppercase tracking-[0.12em] text-stone-dark hover:text-charcoal ${textLink} no-underline`}
            >
              ← Back
            </button>
          ) : (
            <span aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="-mr-3 inline-flex h-11 w-11 items-center justify-center text-charcoal hover:text-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </div>

        {!showSignup ? (
          <>
            <h2 id="signin-title" className="font-display text-3xl text-charcoal">Welcome back</h2>
            <p id="signin-desc" className="mt-3 text-sm leading-relaxed text-stone-dark">
              Sign in to access your cart, orders, and event bookings.
            </p>

            <div className="mt-8">
              {alert && <AuthMessage type={alert.type}>{alert.message}</AuthMessage>}

              <form onSubmit={handleEmailSignIn} noValidate className="space-y-6">
                <Field id="signin-email" label="Email" error={emailError}>
                  <Input
                    ref={firstInputRef}
                    data-autofocus
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={() => email && validateEmail(email)}
                    placeholder="you@example.com"
                  />
                </Field>

                <div>
                  <Field id="signin-password" label="Password" error={passwordError}>
                    <PasswordInput
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) validatePassword(e.target.value);
                      }}
                      onBlur={() => password && validatePassword(password)}
                      placeholder="Enter your password"
                    />
                  </Field>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4">
                    <Link href="/account/forgot-password" onClick={onClose} className={`inline-flex min-h-[44px] items-center text-sm text-stone-dark ${textLink}`}>
                      Forgot password?
                    </Link>
                    <div aria-live="polite" className="text-sm">
                      {locked ? (
                        <span id="signin-lockout" className="text-danger">
                          Too many failed attempts. Try again in {Math.floor((lock - Date.now()) / 60000)} min {Math.ceil(((lock - Date.now()) % 60000) / 1000)}s.
                        </span>
                      ) : (
                        <span className="text-stone-dark">
                          {left > 0 ? `${left} attempt${left === 1 ? '' : 's'} remaining` : 'You have no attempts remaining'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button type="submit" size="lg" disabled={locked || submitting} aria-label="Sign in" className="w-full">
                  {submitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-stone-dark">
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => setShowSignup(true)} className={`inline-flex min-h-[44px] items-center text-charcoal ${textLink}`}>
                  Create one
                </button>
              </p>
            </div>
          </>
        ) : (
          <SignupModal onClose={onClose} />
        )}
      </div>
    </div>
  );
};

export default SignInModal;
