"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { safeRedirect } from "@/lib/safe-redirect";
import AuthLayout, { AuthMessage } from "@/components/account/AuthLayout";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input, { PasswordInput } from "@/components/ui/Input";
import { textLink } from "@/components/ui/form-styles";

function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeRedirect(params?.get("callbackUrl") || params?.get("redirect")) || "/account/orders";
  const { login, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    const validEmail = validateEmail(email);
    const validPassword = validatePassword(password);
    if (!validEmail || !validPassword) return;
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
    <AuthLayout
      title="Welcome back"
      intro="Sign in to track orders, save your address book and check out faster."
      footer={
        <>
          New to Fresh Petals?{" "}
          <Link href={`/account/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className={`text-charcoal ${textLink}`}>
            Create an account
          </Link>
        </>
      }
    >
      {alert && <AuthMessage type={alert.type}>{alert.message}</AuthMessage>}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Field label="Email" error={emailError}>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) validateEmail(e.target.value);
            }}
            onBlur={() => validateEmail(email)}
            placeholder="you@example.com"
          />
        </Field>

        <div>
          <Field label="Password" error={passwordError}>
            <PasswordInput
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              }}
              onBlur={() => validatePassword(password)}
              placeholder="Enter your password"
            />
          </Field>
          <p className="mt-3 text-sm">
            <Link href="/account/forgot-password" className={`inline-flex min-h-[44px] items-center text-stone-dark ${textLink}`}>
              Forgot password?
            </Link>
          </p>
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main>
          <div className="mx-auto w-full max-w-[420px] px-5 py-20" aria-busy="true" />
        </main>
      }
    >
      <LoginView />
    </Suspense>
  );
}
