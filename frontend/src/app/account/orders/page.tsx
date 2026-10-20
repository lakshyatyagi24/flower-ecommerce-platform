"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiOrder, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import OrderCard from "./_components/OrderCard";

type OrdersQuery = { orders: ApiOrder[]; loading: boolean; error: string | null; reload: () => void };

/** The signed-in customer's orders; a signed-out visitor is sent to log in and back. */
function useMyOrders(): OrdersQuery & { user: ReturnType<typeof useAuth>["user"]; authLoading: boolean } {
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
      .then((items) => !cancelled && setOrders(items))
      .catch((err: Error) => !cancelled && setError(err.message || "Could not load orders"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router, tick]);

  return { user, authLoading, orders, loading, error, reload: () => setTick((t) => t + 1) };
}

function EmptyOrders() {
  return (
    <div className="mt-12 border-y border-stone-light py-16 text-center">
      <p className="font-display text-2xl text-charcoal">You don&apos;t have any orders yet.</p>
      <div className="mt-8">
        <Button href="/products">Start shopping</Button>
      </div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="mt-10 space-y-6" aria-busy="true">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
  );
}

export default function MyOrdersPage() {
  const { user, authLoading, orders, loading, error, reload } = useMyOrders();

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
        {loading && <OrdersSkeleton />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {!loading && orders.length === 0 && !error && <EmptyOrders />}
        {orders.length > 0 && (
          <div className="mt-10 border-t border-stone-light">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} fallbackEmail={user?.email || ""} onResolved={reload} />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
