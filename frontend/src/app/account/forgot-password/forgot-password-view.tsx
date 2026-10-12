"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import AuthLayout from "@/components/account/AuthLayout";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { textLink } from "@/components/ui/form-styles";

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
    <AuthLayout
      title="Forgot your password?"
      intro="Enter your email and we'll send you a link to choose a new one."
      footer={
        <Link href="/account/login" className={`text-charcoal ${textLink}`}>
          Back to sign in
        </Link>
      }
    >
      <div role="alert" aria-live="polite" ref={alertRef} tabIndex={-1} className="outline-none">
        {alert && (
          <p
            className={`mb-6 border px-4 py-3 text-sm leading-relaxed ${
              alert.type === "error" ? "border-danger text-danger" : "border-moss text-charcoal"
            }`}
          >
            {alert.message}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Field label="Email">
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
