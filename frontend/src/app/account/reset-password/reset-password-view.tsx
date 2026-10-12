"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { isValidResetToken } from "@/lib/reset-token";
import AuthLayout from "@/components/account/AuthLayout";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/Input";
import { textLink } from "@/components/ui/form-styles";

const INVALID_MESSAGE = "This link is invalid or has expired.";

function ResetForm() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // Keep the token in state so it survives scrubbing it from the URL after success.
  const [token] = useState(params?.get("token"));

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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

  const box = "mb-6 border px-4 py-3 text-sm leading-relaxed";

  let body: React.ReactNode;
  if (done) {
    body = (
      <>
        <div role="alert" aria-live="polite" ref={msgRef} tabIndex={-1} className="outline-none">
          <p className={`${box} border-moss text-charcoal`}>Your password has been updated.</p>
        </div>
        <Button href="/account/login" size="lg" className="w-full">
          Go to sign in
        </Button>
      </>
    );
  } else if (invalid) {
    body = (
      <>
        <div role="alert" aria-live="polite" ref={msgRef} tabIndex={-1} className="outline-none">
          <p className={`${box} border-danger text-danger`}>{INVALID_MESSAGE}</p>
        </div>
        <p className="text-center text-sm">
          <Link href="/account/forgot-password" className={`text-charcoal ${textLink}`}>
            Request a new reset link
          </Link>
        </p>
      </>
    );
  } else {
    body = (
      <>
        <div role="alert" aria-live="polite" ref={msgRef} tabIndex={-1} className="outline-none">
          {error && <p className={`${box} border-danger text-danger`}>{error}</p>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="New password" hint="8 to 128 characters.">
            <PasswordInput
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </>
    );
  }

  return (
    <AuthLayout title="Choose a new password">
      {body}
    </AuthLayout>
  );
}

export default function ResetPasswordView() {
  return (
    <Suspense
      fallback={
        <main>
          <div className="mx-auto w-full max-w-[420px] px-5 py-20" aria-busy="true" />
        </main>
      }
    >
      <ResetForm />
    </Suspense>
  );
}
