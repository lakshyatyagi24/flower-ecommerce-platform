"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiOrder, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatINR } from "@/lib/cart-context";

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/");
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
  }, [user, authLoading, router]);

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
                </div>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-slate-700">
                {o.items.map((it) => (
                  <li key={it.id}>
                    {it.quantity} × {it.productName} — {formatINR(it.unitPrice * it.quantity)}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-olive-green/10 pt-4">
                <div className="font-semibold text-olive-green">Total {formatINR(o.total)}</div>
                <Link
                  href={`/track-order/results?orderId=${o.id}&email=${encodeURIComponent(o.customerEmail || user?.email || "")}`}
                  className="text-olive-green underline-offset-4 hover:underline"
                >
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
