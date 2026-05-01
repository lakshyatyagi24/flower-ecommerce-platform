"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

function RegisterView() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params?.get("callbackUrl") || params?.get("redirect") || "/account/orders";
  const { register, user, loading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(callbackUrl);
    }
  }, [authLoading, user, callbackUrl, router]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Please enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Please enter a valid email";
    if (password.length < 6) next.password = "Password must be at least 6 characters";
    if (confirm !== password) next.confirm = "Passwords do not match";
    if (phone && !/^[0-9+\-\s()]{6,}$/.test(phone)) next.phone = "Please enter a valid phone number";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setAlert({ type: "success", message: "Account created — redirecting…" });
      setTimeout(() => router.push(callbackUrl), 400);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not create account";
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
              alt="Become part of the Fresh Petals family"
              fill
              sizes="(max-width: 768px) 0vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="section-card p-8 sm:p-10">
          <p className="pill mb-3">Create account</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">Join Fresh Petals</h1>
          <p className="mt-2 text-slate-700">
            Save your address, track every order and unlock member-only seasonal drops.
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

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aanya Verma"
                className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40"
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700">
                  Phone (optional)
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-md border-gray-200 shadow-sm pr-16 focus:ring-2 focus:ring-olive-green/40"
                  aria-invalid={!!errors.password}
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
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <input
                id="reg-confirm"
                type={showPassword ? "text" : "password"}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40"
                aria-invalid={!!errors.confirm}
              />
              {errors.confirm && <p className="mt-1 text-sm text-red-600">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-olive-green text-white px-6 py-3 text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition"
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>

            <p className="text-xs text-slate-500">
              By creating an account you agree to our{" "}
              <Link href="/terms" className="text-olive-green underline-offset-2 hover:underline">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-olive-green underline-offset-2 hover:underline">
                privacy policy
              </Link>
              .
            </p>
          </form>

          <p className="mt-6 text-sm text-slate-700">
            Already have an account?{" "}
            <Link
              href={`/account/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="text-olive-green font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="section-shell mt-12 mb-16">Loading…</main>}>
      <RegisterView />
    </Suspense>
  );
}
