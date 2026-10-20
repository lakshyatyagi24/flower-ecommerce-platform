import React from "react";
import Link from "next/link";
import { AuthMessage } from "@/components/account/AuthLayout";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input, { PasswordInput } from "@/components/ui/Input";
import { textLink } from "@/components/ui/form-styles";
import type { SignInState } from "./use-signin";

type AttemptStatusProps = { lock: number; left: number };

function AttemptStatus({ lock, left }: AttemptStatusProps) {
  if (lock) {
    const remaining = lock - Date.now();
    return (
      <span id="signin-lockout" className="text-danger">
        Too many failed attempts. Try again in {Math.floor(remaining / 60000)} min {Math.ceil((remaining % 60000) / 1000)}s.
      </span>
    );
  }
  return (
    <span className="text-stone-dark">
      {left > 0 ? `${left} attempt${left === 1 ? "" : "s"} remaining` : "You have no attempts remaining"}
    </span>
  );
}

type SignInFormProps = {
  state: SignInState;
  firstInputRef: React.Ref<HTMLInputElement>;
  onClose: () => void;
  onShowSignup: () => void;
};

export default function SignInForm({ state, firstInputRef, onClose, onShowSignup }: SignInFormProps) {
  const locked = state.lock > 0;
  return (
    <div className="mt-8">
      {state.alert && <AuthMessage type={state.alert.type}>{state.alert.message}</AuthMessage>}

      <form onSubmit={state.handleSubmit} noValidate className="space-y-6">
        <Field id="signin-email" label="Email" error={state.emailError}>
          <Input
            ref={firstInputRef}
            data-autofocus
            type="email"
            autoComplete="email"
            value={state.email}
            onChange={(e) => state.changeEmail(e.target.value)}
            onBlur={state.blurEmail}
            placeholder="you@example.com"
          />
        </Field>

        <div>
          <Field id="signin-password" label="Password" error={state.passwordError}>
            <PasswordInput
              autoComplete="current-password"
              value={state.password}
              onChange={(e) => state.changePassword(e.target.value)}
              onBlur={state.blurPassword}
              placeholder="Enter your password"
            />
          </Field>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4">
            <Link href="/account/forgot-password" onClick={onClose} className={`inline-flex min-h-[44px] items-center text-sm text-stone-dark ${textLink}`}>
              Forgot password?
            </Link>
            <div aria-live="polite" className="text-sm">
              <AttemptStatus lock={state.lock} left={state.attemptsLeft} />
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" disabled={locked || state.submitting} aria-label="Sign in" className="w-full">
          {state.submitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-dark">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onShowSignup} className={`inline-flex min-h-[44px] items-center text-charcoal ${textLink}`}>
          Create one
        </button>
      </p>
    </div>
  );
}
