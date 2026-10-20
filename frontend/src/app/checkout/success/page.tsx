"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getLastOrderEmail } from "@/lib/guest-order";
import ErrorState from "@/components/ui/ErrorState";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import OrderSummary from "./_components/OrderSummary";
import { GUEST_LOOKUP_COPY } from "./_components/success-logic";

function PageSkeleton() {
  return (
    <main>
      <Container className="py-16" aria-busy="true">
        <Skeleton className="h-10 w-1/3" />
      </Container>
    </main>
  );
}

/**
 * Read the guest's email once, after mount, and keep it in memory: storage is cleared once the order is shown,
 * but a later reload (after paying) still needs it. `undefined` = not read yet.
 */
function useGuestEmail(authLoading: boolean) {
  const [guestEmail, setGuestEmail] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (authLoading) return;
    setGuestEmail((prev) => (prev === undefined ? getLastOrderEmail() : prev));
  }, [authLoading]);
  return guestEmail;
}

function NavButtons({ guest }: { guest: boolean }) {
  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Button href={guest ? "/track-order" : "/account/orders"} className="w-full sm:w-auto">
        {guest ? "Track an order" : "View my orders"}
      </Button>
      <Button href="/products" variant="ghost">
        Continue shopping
      </Button>
    </div>
  );
}

function OrderLookupFailed({ orderId, guest }: { orderId: number | null; guest: boolean }) {
  return (
    <ErrorState
      message={orderId ? GUEST_LOOKUP_COPY : "We couldn't find that order."}
      link={guest ? { href: "/track-order", label: "Track an order" } : { href: "/account/orders", label: "View my orders" }}
    />
  );
}

function CheckoutSuccessView() {
  const params = useSearchParams();
  const rawId = params?.get("orderId");
  const orderId = rawId && /^\d+$/.test(rawId) ? Number(rawId) : null;
  const { user, loading: authLoading } = useAuth();
  const guestEmail = useGuestEmail(authLoading);

  if (authLoading || guestEmail === undefined) return <PageSkeleton />;

  const guest = !user;
  const canLookUp = orderId && (user || guestEmail);
  return (
    <main>
      <Container className="py-12 lg:py-20">
        <div className="max-w-2xl">
          <h1 className="type-h1">Your order</h1>
          {canLookUp ? (
            <OrderSummary orderId={orderId} guestEmail={guestEmail ?? null} />
          ) : (
            <OrderLookupFailed orderId={orderId} guest={guest} />
          )}
          <NavButtons guest={guest} />
        </div>
      </Container>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CheckoutSuccessView />
    </Suspense>
  );
}
