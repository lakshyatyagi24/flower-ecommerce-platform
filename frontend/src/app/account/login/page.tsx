"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params?.get("callbackUrl") || params?.get("redirect") || "/account/orders";
  const { login, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);

  // If a logged-in user lands here (e.g. via back button), forward them to the callback or account page.
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(callbackUrl);
    }
  }, [authLoading, user, callbackUrl, router]);

  const validateEmail = (v: string) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    setEmailError(ok ? null : "Please enter a valid email address");
    return ok;
  };

  const validatePassword = (v: string) => {
    const ok = v.length >= 6;
    setPasswordError(ok ? null : "Password must be at least 6 characters");
    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!validateEmail(email) || !validatePassword(password)) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      setAlert({ type: "success", message: "Signed in — redirecting…" });
      setTimeout(() => router.push(callbackUrl), 350);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Sign in failed";
      setAlert({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="section-shell mt-12 mb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
        <div className="hidden md:block">
          <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-light-brown/10 shadow-[0_28px_70px_rgba(24,20,13,0.14)]">
            <Image
              src="/autumn-rustic-banner.svg"
              alt="Fresh florals welcoming you back"
              fill
              sizes="(max-width: 768px) 0vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="section-card p-8 sm:p-10">
          <p className="pill mb-3">Account</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-slate-700">
            Sign in to track orders, save your address book and check out faster.
          </p>

          {alert && (
            <div
              className={`mt-5 px-3 py-2 rounded text-sm ${
                alert.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
              }`}
              role="alert"
              aria-live="assertive"
            >
              {alert.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40"
                aria-invalid={!!emailError}
              />
              {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onBlur={() => validatePassword(password)}
                  placeholder="Enter your password"
                  className="w-full rounded-md border-gray-200 shadow-sm pr-16 focus:ring-2 focus:ring-olive-green/40"
                  aria-invalid={!!passwordError}
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
              {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-olive-green text-white px-6 py-3 text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-700">
            New to Fresh Petals?{" "}
            <Link
              href={`/account/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="text-olive-green font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="section-shell mt-12 mb-16">Loading…</main>}>
      <LoginView />
    </Suspense>
  );
}
