"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (alert) alertRef.current?.focus();
  }, [alert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim());
      // Always the same message: never reveal whether the account exists.
      setAlert({ type: "success", message: "If an account exists for that email, a reset link is on its way." });
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setAlert({ type: "error", message: "Too many requests. Please wait a minute and try again." });
      } else {
        setAlert({ type: "error", message: "Could not reach the server. Please check your connection and try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="section-shell mt-12 mb-16">
      <div className="section-card p-8 sm:p-10 max-w-lg mx-auto">
        <p className="pill mb-3">Account</p>
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">Forgot your password?</h1>
        <p className="mt-2 text-slate-700">Enter your email and we&apos;ll send you a link to choose a new one.</p>

        <div role="alert" aria-live="polite" ref={alertRef} tabIndex={-1} className="outline-none">
          {alert && (
            <p
              className={`mt-5 px-3 py-2 rounded text-sm ${
                alert.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
              }`}
            >
              {alert.message}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-olive-green/40"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-olive-green text-white px-6 py-3 text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition"
          >
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-700">
          <Link href="/account/login" className="text-olive-green font-semibold hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
