"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { safeRedirect } from "@/lib/safe-redirect";
import {
  clearFailures,
  clearStoredRedirect,
  EMAIL_RE,
  lockedMessage,
  lockedUntil,
  readRedirectTarget,
  recordFailure,
  remainingAttempts,
} from "./signin-attempts";

export type SignInAlert = { type: "error" | "success"; message: string };

const REDIRECT_DELAY_MS = 500;

/** Credentials, inline validation, the attempt throttle and the submit flow of the sign-in form. */
export function useSignIn(onClose: () => void) {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [alert, setAlert] = useState<SignInAlert | null>(null);

  const validateEmail = (v: string) => {
    const ok = EMAIL_RE.test(v);
    setEmailError(ok ? null : "Please enter a valid email address");
    return ok;
  };
  const validatePassword = (v: string) => {
    const ok = v.length >= 6;
    setPasswordError(ok ? null : "Password must be at least 6 characters");
    return ok;
  };

  const changeEmail = (v: string) => {
    setEmail(v);
    if (emailError) validateEmail(v);
  };
  const changePassword = (v: string) => {
    setPassword(v);
    if (passwordError) validatePassword(v);
  };

  const finishSignIn = () => {
    clearFailures(email);
    const target = safeRedirect(readRedirectTarget());
    clearStoredRedirect();
    setAlert({ type: "success", message: "Signed in — welcome back." });
    setTimeout(() => {
      onClose();
      if (target) router.push(target);
    }, REDIRECT_DELAY_MS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    const lock = lockedUntil(email);
    if (lock) return setAlert({ type: "error", message: lockedMessage(lock) });
    const validEmail = validateEmail(email);
    const validPassword = validatePassword(password);
    if (!validEmail || !validPassword) return;
    setSubmitting(true);
    try {
      await login(email, password);
      finishSignIn();
    } catch (err) {
      recordFailure(email);
      setAlert({ type: "error", message: err instanceof Error ? err.message : "Sign in failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    email,
    password,
    emailError,
    passwordError,
    alert,
    submitting,
    lock: lockedUntil(email),
    attemptsLeft: remainingAttempts(email),
    changeEmail,
    changePassword,
    blurEmail: () => email && validateEmail(email),
    blurPassword: () => password && validatePassword(password),
    handleSubmit,
  };
}

export type SignInState = ReturnType<typeof useSignIn>;
