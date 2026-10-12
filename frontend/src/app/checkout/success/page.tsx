"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { EXPIRED_COPY, expiredKindOf, usePayForOrder } from "@/lib/use-pay-for-order";
import PaymentActions from "@/components/PaymentActions";
import { useApi } from "@/lib/use-api";
import { safeRedirect } from "@/lib/safe-redirect";
import { formatINR } from "@/lib/cart-context";
import ErrorState from "@/components/ui/ErrorState";

const RESERVED_NOTE = "Your order is reserved for 30 minutes from when it was placed. After that it is cancelled automatically.";

function OrderSummary({ orderId }: { orderId: number }) {
  const { data: order, error, loading, reload } = useApi(() => api.getMyOrder(orderId), [orderId]);
  // Every resolution (paid / refund due / switched to COD / expired) clears the
  // cart and a matching pending key inside the hook; we just reload the order.
  const pay = usePayForOrder({ orderId, onResolved: () => reload() });

  if (loading && !order) {
    return <div className="mt-6 animate-pulse h-24 bg-slate-100 rounded" aria-busy="true" />;
  }
  if (error || !order) {
    return (
      <ErrorState
        message="We couldn't load your order details, but your order was placed. You can find it in your orders."
        onRetry={reload}
        link={{ href: "/account/orders", label: "View my orders" }}
      />
    );
  }

  const online = order.paymentMethod === "RAZORPAY";
  const unpaid = order.paymentStatus === "UNPAID" || order.paymentStatus === "FAILED";
  const cancelled = order.status === "CANCELLED";
  const paid = order.paymentStatus === "PAID";
  const pending = online && order.status === "PENDING" && unpaid;

  let heading: string;
  let body: React.ReactNode;
  if (cancelled && paid) {
    heading = "Order expired — refund due";
    body = (
      <div className="mt-2" role="status">
        <p>
          Your payment was received after the order expired. We will refund it — contact us if you don&apos;t hear from
          us in 3 working days.
        </p>
        <p className="mt-2">
          <Link href="/contact" className="underline underline-offset-4 text-olive-green">
            Contact us
          </Link>
        </p>
      </div>
    );
  } else if (cancelled) {
    heading = expiredKindOf(order) === "unpaid" ? "Order expired" : "Order cancelled";
    body = (
      <div className="mt-2" role="status">
        <p>{EXPIRED_COPY[expiredKindOf(order)]}</p>
        <p className="mt-2">
          <Link href="/products" className="underline underline-offset-4 text-olive-green">
            Browse products
          </Link>
        </p>
      </div>
    );
  } else if (pending) {
    heading = "Payment pending";
    body = (
      <div className="mt-2">
        <p>Your order #{order.id} is waiting for payment. {RESERVED_NOTE}</p>
        <PaymentActions pay={pay} orderId={order.id} />
      </div>
    );
  } else if (online && paid) {
    heading = "Payment received";
    body = (
      <p className="mt-2">
        Your order #{order.id} has been confirmed. We&apos;ll be in touch shortly with delivery details.
      </p>
    );
  } else if (!online) {
    heading = "Order placed — pay on delivery";
    body = (
      <p className="mt-2">
        Your order #{order.id} has been confirmed. We&apos;ll be in touch shortly with
        delivery details.
      </p>
    );
  } else {
    heading = "Order received";
    body = <p className="mt-2">Your order #{order.id} is being processed.</p>;
  }

  return (
    <div className="mt-6 text-left text-sm text-slate-700">
      <h2 className="text-xl font-semibold text-slate-900">{heading}</h2>
      {body}
      <ul className="mt-4 space-y-1">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between gap-4">
            <span>
              {it.productName} × {it.quantity}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-3 border-t border-olive-green/10 flex justify-between font-semibold text-slate-900">
        <span>Total</span>
        <span>{formatINR(order.total)}</span>
      </div>
    </div>
  );
}

function CheckoutSuccessView() {
  const router = useRouter();
  const params = useSearchParams();
  const rawId = params?.get("orderId");
  const orderId = rawId && /^\d+$/.test(rawId) ? Number(rawId) : null;
  const { user, loading: authLoading } = useAuth();

  // The order is loaded through the authenticated /orders/mine endpoint; guests
  // are sent to login with a safe callback back to this page.
  useEffect(() => {
    if (authLoading || user) return;
    const back = safeRedirect(orderId ? `/checkout/success?orderId=${orderId}` : "/account/orders") || "/account/orders";
    router.replace(`/account/login?callbackUrl=${encodeURIComponent(back)}`);
  }, [authLoading, user, orderId, router]);

  if (authLoading || !user) {
    return <main className="section-shell mt-12 mb-16">Loading…</main>;
  }

  return (
    <main className="section-shell mt-12 mb-16 text-center">
      <div className="mx-auto max-w-xl section-card p-10">
        <div className="text-5xl mb-4">🌸</div>
        <h1 className="text-3xl font-semibold text-slate-900">Your order</h1>
        {orderId ? (
          <OrderSummary orderId={orderId} />
        ) : (
          <ErrorState
            message="We couldn't find that order."
            link={{ href: "/account/orders", label: "View my orders" }}
          />
        )}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/account/orders" className="bg-olive-green text-white px-6 py-3 rounded-full font-semibold hover:opacity-95">
            View my orders
          </Link>
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
