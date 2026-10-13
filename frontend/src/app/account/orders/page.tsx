"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiOrder, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatINR } from "@/lib/cart-context";
import { setTrackEmail } from "@/lib/track-order-session";
import { usePayForOrder } from "@/lib/use-pay-for-order";
import PaymentActions from "@/components/PaymentActions";
import { canPayNow, paymentLabel } from "@/lib/order-labels";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";

// Pay now (and Check status after a problem) for one order. Resolving the order
// clears the cart / pending key inside the hook, then we refresh the list.
function OrderPayment({ order, onResolved }: { order: ApiOrder; onResolved: () => void }) {
  const pay = usePayForOrder({ orderId: order.id, onResolved });
  return <PaymentActions pay={pay} orderId={order.id} allowSwitch={false} />;
}

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/account/login?callbackUrl=${encodeURIComponent("/account/orders")}`);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
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

  if (authLoading || (!user && !error)) {
    return (
      <main>
        <Container className="py-12 lg:py-16" aria-busy="true">
          <Skeleton className="h-10 w-1/3" />
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container className="py-12 lg:py-16">
        <h1 className="type-h1">My orders</h1>

        {loading && (
          <div className="mt-10 space-y-6" aria-busy="true">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        )}
        {error && <ErrorState message={error} onRetry={() => setTick((t) => t + 1)} />}

        {!loading && orders.length === 0 && !error && (
          <div className="mt-12 border-y border-stone-light py-16 text-center">
            <p className="font-display text-2xl text-charcoal">You don&apos;t have any orders yet.</p>
            <div className="mt-8">
              <Button href="/products">Start shopping</Button>
            </div>
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-10 border-t border-stone-light">
            {orders.map((o) => {
              const units = o.items.reduce((n, it) => n + it.quantity, 0);
              return (
                <article key={o.id} className="border-b border-stone-light py-8">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="font-display text-2xl text-charcoal">Order #{o.id}</h2>
                      <p className="mt-1 text-sm text-stone-dark">
                        {new Date(o.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })} · {units} {units === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <div className="md:text-right">
                      <p className="text-xs font-medium tracking-[0.16em] text-charcoal">{o.status}</p>
                      <p className="mt-1 text-sm text-stone-dark">{paymentLabel(o)}</p>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2 text-sm text-charcoal">
                    {o.items.map((it) => (
                      <li key={it.id} className="flex justify-between gap-4">
                        <span>
                          {it.quantity} × {it.productName}
                        </span>
                        <span className="shrink-0 whitespace-nowrap">{formatINR(it.unitPrice * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-6 space-y-2 border-t border-stone-light pt-4 text-sm text-stone-dark">
                    <div className="flex justify-between gap-4">
                      <dt>Subtotal</dt>
                      <dd className="text-charcoal">{formatINR(o.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Shipping</dt>
                      <dd className="text-charcoal">{o.shipping === 0 ? "Free" : formatINR(o.shipping)}</dd>
                    </div>
                    {o.gst && o.gst > 0 ? (
                      <div className="flex justify-between gap-4">
                        <dt>GST</dt>
                        <dd className="text-charcoal">{formatINR(o.gst)}</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-4 pt-2 text-base text-charcoal">
                      <dt>Total</dt>
                      <dd className="font-display text-xl">{formatINR(o.total)}</dd>
                    </div>
                  </dl>

                  <div className="mt-2">
                    {canPayNow(o) && <OrderPayment order={o} onResolved={() => setTick((t) => t + 1)} />}
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        href={`/track-order/results?orderId=${o.id}`}
                        onClick={() => setTrackEmail(o.customerEmail || user?.email || "")}
                      >
                        View details
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </main>
  );
}
