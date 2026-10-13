"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import OrderTimeline from "@/components/OrderTimeline";
import { ApiOrder, api, ApiError } from "@/lib/api";
import { formatINR } from "@/lib/cart-context";
import { clearTrackEmail, getTrackEmail } from "@/lib/track-order-session";
import { productImage } from "@/lib/product-image";
import { paymentLine } from "@/lib/order-labels";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { textLink } from "@/components/ui/form-styles";

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

const label = "font-sans text-xs font-medium uppercase tracking-[0.16em] text-stone-dark";

function TrackOrderResultsView() {
  const params = useSearchParams();
  const orderId = params?.get("orderId") || "";
  // Email arrives via sessionStorage (never the URL). null = not read yet.
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    // Read once into state, then drop it from storage once the lookup finishes.
    setEmail(getTrackEmail() ?? "");
  }, []);
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (email === null) return;
    if (!orderId) {
      clearTrackEmail();
      setLoading(false);
      setError("No Order ID provided.");
      return;
    }
    if (!email) {
      setLoading(false);
      setError("Please re-enter the email used at checkout to track this order.");
      return;
    }
    if (!/^\d+$/.test(orderId.trim())) {
      clearTrackEmail();
      setLoading(false);
      setError("Order ID must be numeric.");
      return;
    }
    const idNum = parseInt(orderId.trim(), 10);
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
        if (!cancelled) {
          clearTrackEmail();
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, email]);

  if (loading) {
    return (
      <main>
        <Container className="py-12 lg:py-16" aria-busy="true">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="mt-4 h-4 w-1/4" />
          <Skeleton className="mt-10 h-64" />
        </Container>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main>
        <Container className="py-16 lg:py-24">
          <div className="mx-auto max-w-xl text-center">
            <h1 className="type-h2">We couldn&apos;t find that order</h1>
            <p role="alert" className="mt-4 text-base leading-relaxed text-stone-dark">
              {error}
            </p>
            <div className="mt-8">
              <Button href={/^\d+$/.test(orderId) ? `/track-order?orderId=${orderId}` : "/track-order"}>Try again</Button>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  const { phases, currentIndex } = buildPhases(order);
  const placedAt = new Date(order.createdAt);
  const cancelled = order.status === "CANCELLED";

  return (
    <main>
      <Container className="py-10 lg:py-16">
        <header className="flex flex-col gap-3 border-b border-stone-light pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="type-h1">Order #{order.id}</h1>
            <p className="mt-3 text-sm text-stone-dark">Placed {placedAt.toLocaleDateString(undefined, { dateStyle: "long" })}</p>
          </div>
          <div className="sm:text-right">
            <p className={label}>Status</p>
            <p className="mt-1 text-sm font-medium tracking-[0.16em] text-charcoal">{order.status}</p>
          </div>
        </header>

        {cancelled && (
          <p className="mt-8 border border-stone-light px-4 py-3 text-sm leading-relaxed text-charcoal">
            This order was cancelled. If this is unexpected, please reach out to support.
          </p>
        )}

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16">
          <div className="space-y-12 lg:col-span-7">
            <section aria-labelledby="progress-heading">
              <h2 id="progress-heading" className={`${label} mb-6`}>
                Order progress
              </h2>
              <OrderTimeline phases={phases} currentIndex={currentIndex} />
            </section>

            {order.trackingNumber && (
              <section aria-labelledby="shipment-heading">
                <h2 id="shipment-heading" className={`${label} mb-3`}>
                  Shipment tracking
                </h2>
                {/* Courier and tracking number are plain text: never turned into links. */}
                <p className="text-base text-charcoal">
                  {order.courierName && <span className="block text-sm text-stone-dark">{order.courierName}</span>}
                  <span className="break-all">{order.trackingNumber}</span>
                </p>
              </section>
            )}

            <section aria-labelledby="delivery-heading">
              <h2 id="delivery-heading" className={`${label} mb-3`}>
                Delivery details
              </h2>
              <div className="text-base leading-relaxed text-charcoal">
                {order.customerName && <div>{order.customerName}</div>}
                {order.customerPhone && <div>{order.customerPhone}</div>}
                {order.shippingAddress && <div className="whitespace-pre-line">{order.shippingAddress}</div>}
                {(order.city || order.postalCode) && (
                  <div>
                    {order.city}
                    {order.city && order.postalCode ? ", " : ""}
                    {order.postalCode}
                  </div>
                )}
              </div>
              {order.notes && (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-dark">
                  <span className="block text-xs font-medium uppercase tracking-[0.16em]">Delivery notes</span>
                  <span className="mt-1 block">{order.notes}</span>
                </p>
              )}
            </section>
          </div>

          <aside aria-labelledby="items-heading" className="lg:col-span-5 lg:self-start lg:bg-ivory-deep lg:p-8">
            <h2 id="items-heading" className={`${label} mb-6`}>
              Items in this order
            </h2>
            <ul className="space-y-5">
              {order.items.map((it) => (
                <li key={it.id} className="flex gap-4">
                  <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-sm bg-ivory-deep lg:bg-ivory">
                    <Image src={productImage(it.product)} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="text-charcoal">{it.productName}</div>
                    <div className="mt-1 text-stone-dark">
                      Qty {it.quantity} × {formatINR(it.unitPrice)}
                    </div>
                  </div>
                  <div className="text-sm text-charcoal">{formatINR(it.unitPrice * it.quantity)}</div>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-3 border-t border-stone-light pt-6 text-sm text-stone-dark">
              <div className="flex justify-between gap-4">
                <dt>Payment</dt>
                <dd className="text-charcoal">{paymentLine(order)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Subtotal</dt>
                <dd className="text-charcoal">{formatINR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Shipping</dt>
                <dd className="text-charcoal">{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</dd>
              </div>
              {order.gst && order.gst > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt>GST</dt>
                  <dd className="text-charcoal">{formatINR(order.gst)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 border-t border-stone-light pt-4 text-base text-charcoal">
                <dt>Total</dt>
                <dd className="font-display text-2xl">{formatINR(order.total)}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-stone-light pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-stone-dark">
            Need help?{" "}
            <Link href="/contact" className={`text-charcoal ${textLink}`}>
              Contact support
            </Link>
          </p>
          <Button variant="ghost" href="/products">
            Continue shopping
          </Button>
        </div>
      </Container>
    </main>
  );
}

export default function TrackOrderResults() {
  return (
    <Suspense
      fallback={
        <main>
          <Container className="py-12" aria-busy="true">
            <Skeleton className="h-10 w-1/3" />
          </Container>
        </main>
      }
    >
      <TrackOrderResultsView />
    </Suspense>
  );
}
