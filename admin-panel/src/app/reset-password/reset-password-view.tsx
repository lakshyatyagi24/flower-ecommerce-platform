"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import { isValidResetToken } from "@/lib/reset-token";

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

  const handleSubmit = async (e: FormEvent) => {
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
      await adminApi.resetPassword(token, password);
      setDone(true);
      // Remove the token from the address bar / history.
      router.replace(pathname || "/reset-password");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) setExpired(true);
      else setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const alertBox = (cls: string, text: string) => (
    <div role="alert" aria-live="polite" ref={msgRef} tabIndex={-1} className="outline-none">
      <p className={`mb-4 p-3 rounded-md text-sm ${cls}`}>{text}</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Choose a new password</CardTitle>
        </CardHeader>
        <CardContent>
          {done ? (
            <>
              {alertBox("bg-green-50 text-green-700", "Your password has been updated.")}
              <Button asChild className="w-full">
                <Link href="/login">Go to sign in</Link>
              </Button>
            </>
          ) : invalid ? (
            <>
              {alertBox("bg-destructive/10 text-destructive", "This link is invalid or has expired.")}
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Request a new reset link
              </Link>
            </>
          ) : (
            <>
              <div role="alert" aria-live="polite" ref={msgRef} tabIndex={-1} className="outline-none">
                {error && <p className="mb-4 p-3 rounded-md text-sm bg-destructive/10 text-destructive">{error}</p>}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? "Updating..." : "Update password"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordView() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
