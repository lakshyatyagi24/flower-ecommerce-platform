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

function RegisterView() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeRedirect(params?.get("callbackUrl") || params?.get("redirect")) || "/account/orders";
  const { register, user, loading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

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
    if (password.length < 8) next.password = "Password must be at least 8 characters";
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
    <AuthLayout
      title="Join Fresh Petals"
      intro="Save your address and track every order."
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/account/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className={`text-charcoal ${textLink}`}>
            Sign in
          </Link>
        </>
      }
    >
      {alert && <AuthMessage type={alert.type}>{alert.message}</AuthMessage>}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Field label="Full name" error={errors.name}>
          <Input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aanya Verma" />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Phone" optional error={errors.phone}>
          <Input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Password" hint="At least 8 characters." error={errors.password}>
          <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>

        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-xs leading-relaxed text-stone-dark">
          By creating an account you agree to our{" "}
          <Link href="/terms" className={textLink}>
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className={textLink}>
            privacy policy
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main>
          <div className="mx-auto w-full max-w-[420px] px-5 py-20" aria-busy="true" />
        </main>
      }
    >
      <RegisterView />
    </Suspense>
  );
}
