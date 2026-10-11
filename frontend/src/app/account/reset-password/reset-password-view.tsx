"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { isValidResetToken } from "@/lib/reset-token";

const INVALID_MESSAGE = "This link is invalid or has expired.";

function ResetForm() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // Keep the token in state so it survives scrubbing it from the URL after success.
  const [token] = useState(params?.get("token"));

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const msgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error || done || expired) msgRef.current?.focus();
  }, [error, done, expired]);

  const invalid = !isValidResetToken(token) || expired;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidResetToken(token)) return;
    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      // Remove the token from the address bar / history.
      router.replace(pathname || "/account/reset-password");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) setExpired(true);
      else setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const box = "mt-5 px-3 py-2 rounded text-sm";

  let body: React.ReactNode;
  if (done) {
    body = (
      <>
        <div role="alert" aria-live="polite" ref={msgRef} tabIndex={-1} className="outline-none">
          <p className={`${box} bg-green-50 text-green-700`}>Your password has been updated.</p>
        </div>
        <Link
          href="/account/login"
          className="mt-6 w-full inline-flex items-center justify-center rounded-full bg-olive-green text-white px-6 py-3 text-sm font-semibold shadow-md hover:shadow-lg transition"
        >
          Go to sign in
        </Link>
      </>
    );
  } else if (invalid) {
    body = (
      <>
        <div role="alert" aria-live="polite" ref={msgRef} tabIndex={-1} className="outline-none">
          <p className={`${box} bg-red-50 text-red-700`}>{INVALID_MESSAGE}</p>
        </div>
        <p className="mt-6 text-sm text-slate-700">
          <Link href="/account/forgot-password" className="text-olive-green font-semibold hover:underline">
            Request a new reset link
          </Link>
        </p>
      </>
    );
  } else {
    body = (
      <>
        <div role="alert" aria-live="polite" ref={msgRef} tabIndex={-1} className="outline-none">
          {error && <p className={`${box} bg-red-50 text-red-700`}>{error}</p>}
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700">
              New password
            </label>
            <div className="mt-1 relative">
              <input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border-gray-200 shadow-sm pr-16 focus:ring-2 focus:ring-olive-green/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-olive-green/80 px-2 py-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="reset-confirm" className="block text-sm font-medium text-gray-700">
              Confirm new password
            </label>
            <input
              id="reset-confirm"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-olive-green text-white px-6 py-3 text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition"
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>
      </>
    );
  }

  return (
    <div className="section-card p-8 sm:p-10 max-w-lg mx-auto">
      <p className="pill mb-3">Account</p>
      <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">Choose a new password</h1>
      {body}
    </div>
  );
}

export default function ResetPasswordView() {
  return (
    <main className="section-shell mt-12 mb-16">
      <Suspense fallback={<p>Loading…</p>}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
