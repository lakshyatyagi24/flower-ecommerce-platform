"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiOrder, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatINR } from "@/lib/cart-context";
import { setTrackEmail } from "@/lib/track-order-session";
import { payForOrder, type PayHandlers } from "@/lib/razorpay-flow";

function paymentLabel(o: ApiOrder): string {
  if (o.paymentStatus === "REFUNDED") return "Refunded";
  if (o.paymentStatus === "PAID") return o.status === "CANCELLED" ? "Paid — refund due" : "Paid";
  if (o.paymentMethod === "COD") return "Cash on delivery";
  if (o.status === "CANCELLED") return "Payment not completed";
  return "Payment pending";
}

function canPayNow(o: ApiOrder): boolean {
  return (
    o.paymentMethod === "RAZORPAY" &&
    o.status === "PENDING" &&
    (o.paymentStatus === "UNPAID" || o.paymentStatus === "FAILED")
  );
}

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [payNotes, setPayNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/account/login?callbackUrl=${encodeURIComponent("/account/orders")}`);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .listMyOrders()
      .then((items) => {
        if (!cancelled) setOrders(items);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Could not load orders");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router, tick]);

  const setNote = (id: number, msg: string | null) =>
    setPayNotes((n) => {
      const next = { ...n };
      if (msg) next[id] = msg;
      else delete next[id];
      return next;
    });

  const handlersFor = (id: number): PayHandlers => ({
    onPaid: () => {
      setNote(id, null);
      setTick((t) => t + 1);
    },
    onRefundDue: () => {
      setNote(id, null);
      setTick((t) => t + 1);
    },
    onDismiss: () => setNote(id, "Payment not completed. Your order stays reserved for 30 minutes from when it was placed."),
    onFailure: () => setNote(id, "Payment not completed. Your order stays reserved for 30 minutes from when it was placed."),
    onVerifyError: (m) => {
      setNote(id, m);
      setTick((t) => t + 1);
    },
    onError: (m) => setNote(id, m),
  });

  if (authLoading || (!user && !error)) {
    return (
      <main className="section-shell mt-12 mb-16">
        <div className="animate-pulse h-12 bg-slate-200 rounded w-1/3" />
      </main>
    );
  }

  return (
    <main className="section-shell mt-12 mb-16">
      <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-6">My orders</h1>

      {loading && <div className="text-slate-700">Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && orders.length === 0 && !error && (
        <div className="section-card p-8 text-center">
          <p className="text-slate-700">You don&apos;t have any orders yet.</p>
          <Link href="/products" className="mt-4 inline-block bg-olive-green text-white px-6 py-3 rounded-full font-semibold hover:opacity-95">
            Start shopping
          </Link>
        </div>
      )}

      {orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((o) => (
            <article key={o.id} className="section-card p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Order #{o.id}</h2>
                  <p className="text-sm text-slate-600">
                    Placed {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600">Status</div>
                  <div className="font-semibold text-olive-green">{o.status}</div>
                  <div className="text-sm text-slate-700 mt-1">{paymentLabel(o)}</div>
                </div>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-slate-700">
                {o.items.map((it) => (
                  <li key={it.id}>
                    {it.quantity} × {it.productName} — {formatINR(it.unitPrice * it.quantity)}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-olive-green/10 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-sm text-slate-700 space-y-1">
                  <div className="flex justify-between sm:justify-start sm:gap-3">
                    <span className="text-slate-500">Subtotal</span>
                    <span>{formatINR(o.subtotal)}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start sm:gap-3">
                    <span className="text-slate-500">Shipping</span>
                    <span>{o.shipping === 0 ? "Free" : formatINR(o.shipping)}</span>
                  </div>
                  {o.gst && o.gst > 0 ? (
                    <div className="flex justify-between sm:justify-start sm:gap-3">
                      <span className="text-slate-500">GST</span>
                      <span>{formatINR(o.gst)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between sm:justify-start sm:gap-3 font-semibold text-olive-green">
                    <span>Total</span>
                    <span>{formatINR(o.total)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:items-end sm:justify-end">
                  {canPayNow(o) && (
                    <button
                      type="button"
                      onClick={() => {
                        setNote(o.id, null);
                        void payForOrder(o.id, handlersFor(o.id));
                      }}
                      className="bg-olive-green text-white px-5 py-2 rounded-full font-semibold hover:opacity-95"
                    >
                      Pay now
                    </button>
                  )}
                  {payNotes[o.id] && (
                    <p className="text-sm text-amber-800 sm:text-right" role="status">
                      {payNotes[o.id]}
                    </p>
                  )}
                  <Link
                    href={`/track-order/results?orderId=${o.id}`}
                    onClick={() => setTrackEmail(o.customerEmail || user?.email || "")}
                    className="text-olive-green underline-offset-4 hover:underline"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
