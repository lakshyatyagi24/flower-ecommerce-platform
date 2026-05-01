"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function CheckoutSuccessView() {
  const params = useSearchParams();
  const orderId = params?.get("orderId");
  const emailParam = params?.get("email");
  const { user } = useAuth();

  // Track-order requires (orderId + email). Prefer the email passed from checkout,
  // fall back to the logged-in user's email; otherwise send guests to /track-order
  // pre-filled with their orderId so they can enter the email used at checkout.
  const trackEmail = emailParam || user?.email || null;
  const trackHref = orderId
    ? trackEmail
      ? `/track-order/results?orderId=${orderId}&email=${encodeURIComponent(trackEmail)}`
      : `/track-order?orderId=${orderId}`
    : null;

  return (
    <main className="section-shell mt-12 mb-16 text-center">
      <div className="mx-auto max-w-xl section-card p-10">
        <div className="text-5xl mb-4">🌸</div>
        <h1 className="text-3xl font-semibold text-slate-900">Thank you for your order!</h1>
        <p className="mt-2 text-slate-700">
          {orderId
            ? `Your order #${orderId} has been confirmed. We'll be in touch shortly with delivery details.`
            : "Your order has been confirmed. We'll be in touch shortly."}
        </p>
        {orderId && !trackEmail && (
          <p className="mt-2 text-xs text-slate-500">
            Save your order number — you&apos;ll need it (with the email you provided) to track delivery status.
          </p>
        )}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {trackHref && (
            <Link
              href={trackHref}
              className="bg-olive-green text-white px-6 py-3 rounded-full font-semibold hover:opacity-95"
            >
              Track this order
            </Link>
          )}
          <Link href="/products" className="text-olive-green font-semibold underline-offset-4 hover:underline self-center">
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<main className="section-shell mt-12 mb-16">Loading…</main>}>
      <CheckoutSuccessView />
    </Suspense>
  );
}
