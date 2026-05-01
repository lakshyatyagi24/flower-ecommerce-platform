"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import OrderTimeline from "@/components/OrderTimeline";
import { ApiOrder, api, ApiError } from "@/lib/api";
import { formatINR } from "@/lib/cart-context";

type Phase = { key: string; label: string; time: Date | null };

function buildPhases(order: ApiOrder): { phases: Phase[]; currentIndex: number } {
  const placedAt = new Date(order.createdAt);
  const updatedAt = new Date(order.updatedAt);
  const phases: Phase[] = [
    { key: "placed", label: "Order Placed", time: placedAt },
    { key: "preparing", label: "Preparing", time: null },
    { key: "out", label: "Out for Delivery", time: null },
    { key: "delivered", label: "Delivered", time: null },
  ];

  switch (order.status) {
    case "PENDING":
      // only placed
      break;
    case "PAID":
      phases[1].time = updatedAt;
      break;
    case "SHIPPED":
      phases[1].time = updatedAt;
      phases[2].time = updatedAt;
      break;
    case "COMPLETED":
      phases[1].time = updatedAt;
      phases[2].time = updatedAt;
      phases[3].time = updatedAt;
      break;
    case "CANCELLED":
      // leave only placed and rely on banner
      break;
  }
  let currentIndex = 0;
  phases.forEach((p, i) => {
    if (p.time) currentIndex = i;
  });
  return { phases, currentIndex };
}

function fmt(d?: Date | null) {
  if (!d) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function TrackOrderResultsView() {
  const params = useSearchParams();
  const orderId = params?.get("orderId") || "";
  const email = params?.get("email") || params?.get("contact") || "";
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("No Order ID provided.");
      return;
    }
    if (!email) {
      setLoading(false);
      setError("Email is required to track this order.");
      return;
    }
    const idNum = parseInt(orderId, 10);
    if (isNaN(idNum)) {
      setLoading(false);
      setError("Order ID must be numeric.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .trackOrder(idNum, email)
      .then((o) => {
        if (!cancelled) setOrder(o);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : err.message || "Could not load order");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, email]);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-32 bg-slate-200 rounded mt-4" />
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-2">We couldn&apos;t find that order</h2>
          <p className="text-sm text-red-600">{error}</p>
          <Link href="/track-order" className="mt-4 inline-block text-olive-green underline-offset-4 hover:underline">
            Try again
          </Link>
        </div>
      </main>
    );
  }

  const { phases, currentIndex } = buildPhases(order);
  const placedAt = new Date(order.createdAt);
  const cancelled = order.status === "CANCELLED";

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 rustic-vignette">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Order #{order.id}</h2>
            <div className="text-sm text-slate-600">Placed {placedAt.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Status</div>
            <div className="text-lg font-medium text-olive-green">{order.status}</div>
          </div>
        </header>

        {cancelled && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-md text-sm">
            This order was cancelled. If this is unexpected, please reach out to support.
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Delivery details</h3>
              <div className="mt-2 text-sm text-slate-600">
                <div><strong>{order.customerName}</strong></div>
                {order.customerPhone && <div>{order.customerPhone}</div>}
                <div>{order.shippingAddress}</div>
                {(order.city || order.postalCode) && (
                  <div>
                    {order.city}
                    {order.city && order.postalCode ? ", " : ""}
                    {order.postalCode}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Order progress</h3>
              <OrderTimeline phases={phases} currentIndex={currentIndex} />
            </div>

            {order.trackingNumber && (
              <div className="mt-6 rounded-md border border-olive-green/15 bg-olive-green/5 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Shipment tracking</h3>
                <div className="text-sm text-slate-700">
                  {order.courierName && <span className="block text-xs uppercase tracking-wide text-olive-green/70">{order.courierName}</span>}
                  <span className="font-mono text-base text-slate-900 break-all">{order.trackingNumber}</span>
                </div>
              </div>
            )}
          </div>

          <aside className="bg-slate-50 p-4 rounded-md text-sm">
            <div className="mb-3">
              <div className="text-slate-600">Payment</div>
              <div className="text-olive-green font-semibold">{order.paymentMethod}</div>
            </div>
            <div className="mb-3">
              <div className="text-slate-600">Subtotal</div>
              <div>{formatINR(order.subtotal)}</div>
            </div>
            <div className="mb-3">
              <div className="text-slate-600">Shipping</div>
              <div>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</div>
            </div>
            {order.gst && order.gst > 0 ? (
              <div className="mb-3">
                <div className="text-slate-600">GST</div>
                <div>{formatINR(order.gst)}</div>
              </div>
            ) : null}
            <div>
              <div className="text-slate-600">Total</div>
              <div className="text-lg font-semibold text-olive-green">{formatINR(order.total)}</div>
            </div>
          </aside>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Items in this order</h3>
          <div className="bg-slate-50 p-4 rounded-md">
            <ul className="space-y-3">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-white flex-shrink-0 relative">
                    {it.product?.image ? (
                      <Image src={it.product.image} alt={it.productName} fill sizes="56px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">🌸</div>
                    )}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-slate-800">{it.productName}</div>
                    <div className="text-slate-500 text-xs">Qty: {it.quantity} × {formatINR(it.unitPrice)}</div>
                  </div>
                  <div className="text-sm font-medium">{formatINR(it.unitPrice * it.quantity)}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {order.notes && (
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Delivery notes</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{order.notes}</p>
          </section>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-olive-green/10">
          <div className="text-sm">
            <div className="font-medium mb-1">Need help?</div>
            <Link href="/contact" className="text-olive-green underline-offset-4 hover:underline">Contact support</Link>
          </div>
          <Link href="/products" className="text-olive-green font-semibold underline-offset-4 hover:underline">Continue shopping</Link>
        </div>
      </div>
    </main>
  );
}

export default function TrackOrderResults() {
  return (
    <Suspense fallback={<main className="max-w-3xl mx-auto px-4 py-12">Loading…</main>}>
      <TrackOrderResultsView />
    </Suspense>
  );
}
