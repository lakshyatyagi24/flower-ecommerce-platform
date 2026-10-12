"use client";
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { clearTrackEmail, setTrackEmail } from "@/lib/track-order-session";
import AuthLayout from "@/components/account/AuthLayout";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { textLink } from "@/components/ui/form-styles";

function TrackOrderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ orderId?: string; email?: string }>({});

  // Pre-fill from query (orderId only — the email is never put in a URL).
  // Drop any email left over from an earlier lookup.
  useEffect(() => {
    clearTrackEmail();
  }, []);

  useEffect(() => {
    const qOrder = searchParams?.get("orderId");
    if (qOrder) setOrderId(qOrder);
  }, [searchParams]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!orderId.trim()) {
      setErrors({ orderId: "Please enter your Order ID." });
      return;
    }
    if (!/^\d+$/.test(orderId.trim())) {
      setErrors({ orderId: "Order ID must be a number (e.g., 1042)." });
      return;
    }
    if (!email.trim()) {
      setErrors({ email: "Please enter the email used at checkout." });
      return;
    }

    const params = new URLSearchParams();
    params.set("orderId", orderId.trim());
    setTrackEmail(email.trim());
    router.push(`/track-order/results?${params.toString()}`);
  }

  return (
    <AuthLayout
      title="Track your order"
      intro="Enter your Order ID and the email used at checkout to see delivery status."
      footer={
        <Link href="/contact" className={`text-charcoal ${textLink}`}>
          Need help? Contact support
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Field label="Order ID" error={errors.orderId}>
          <Input inputMode="numeric" autoComplete="off" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="e.g., 1042" />
        </Field>
        <Field label="Email at checkout" error={errors.email}>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Button type="submit" size="lg" className="w-full">
          Track order
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <main>
          <div className="mx-auto w-full max-w-[420px] px-5 py-20" aria-busy="true" />
        </main>
      }
    >
      <TrackOrderInner />
    </Suspense>
  );
}
