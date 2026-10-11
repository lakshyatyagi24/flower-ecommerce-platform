"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";

// noindex metadata lives in ./layout.tsx (client pages cannot export metadata).
export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const msgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msg) msgRef.current?.focus();
  }, [msg]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSubmitting(true);
    try {
      await adminApi.forgotPassword(email.trim());
      // Always the same message: never reveal whether the account exists.
      setMsg({ type: "success", text: "If an account exists for that email, a reset link is on its way." });
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setMsg({ type: "error", text: "Too many requests. Please wait a minute and try again." });
      } else {
        setMsg({ type: "error", text: "Could not reach the server. Please check your connection and try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <p className="text-sm text-muted-foreground">Enter your admin email and we will send you a reset link.</p>
        </CardHeader>
        <CardContent>
          <div role="alert" aria-live="polite" ref={msgRef} tabIndex={-1} className="outline-none">
            {msg && (
              <p
                className={`mb-4 p-3 rounded-md text-sm ${
                  msg.type === "error" ? "bg-destructive/10 text-destructive" : "bg-green-50 text-green-700"
                }`}
              >
                {msg.text}
              </p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Sending..." : "Send reset link"}
            </Button>
          </form>
          <p className="mt-4 text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
