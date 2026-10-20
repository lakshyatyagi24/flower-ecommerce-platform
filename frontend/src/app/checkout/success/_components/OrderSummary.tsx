"use client";

import React, { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { clearLastOrderEmail } from "@/lib/guest-order";
import { usePayForOrder } from "@/lib/use-pay-for-order";
import { useApi } from "@/lib/use-api";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import OrderDetails from "./OrderDetails";
import OrderOutcome from "./OrderOutcome";
import { fetchSummaryOrder, isStillPayable } from "./success-logic";

function LoadFailed({ signedIn, onRetry }: { signedIn: boolean; onRetry: () => void }) {
  return (
    <ErrorState
      message={
        signedIn
          ? "We couldn't load your order details, but your order was placed. You can find it in your orders."
          : "We couldn't load your order details, but your order was placed. Check your confirmation email, or track it with your order number and email."
      }
      onRetry={onRetry}
      link={signedIn ? { href: "/account/orders", label: "View my orders" } : { href: "/track-order", label: "Track an order" }}
    />
  );
}

/**
 * Signed-in customers read the order through their account. A guest reads it with the order's email, handed over
 * in sessionStorage by checkout (never the URL) and removed again once the order is shown in a final state.
 */
export default function OrderSummary({ orderId, guestEmail }: { orderId: number; guestEmail: string | null }) {
  const { user } = useAuth();
  // Set when the order had to be read with the email (a guest order viewed after signing in): its key is spent too.
  const viaEmail = useRef(false);
  const { data: order, error, loading, reload } = useApi(
    () => fetchSummaryOrder(orderId, Boolean(user), guestEmail, () => (viaEmail.current = true)),
    [orderId],
  );
  // The email has done its job once the order is displayed, unless the shopper still has to pay: then Pay now,
  // Check status and Switch to COD need it (and so does the reload after they resolve).
  useEffect(() => {
    if ((user && !viaEmail.current) || !order) return;
    if (!isStillPayable(order)) clearLastOrderEmail();
  }, [user, order]);
  // Every resolution (paid / refund due / switched to COD / expired) clears the
  // cart and a matching pending key inside the hook; we just reload the order.
  const pay = usePayForOrder({ orderId, onResolved: () => reload() });
  // Hide "Pay now" when online payments are off. Unknown (loading/failed) keeps it: the order already exists.
  const { data: paymentConfig } = useApi(() => api.getPaymentConfig(), []);
  const payEnabled = paymentConfig?.enabled !== false;

  if (loading && !order) return <Skeleton className="mt-8 h-40" />;
  if (error || !order) return <LoadFailed signedIn={Boolean(user)} onRetry={reload} />;
  return (
    <div className="mt-10 border-t border-stone-light pt-10 text-base leading-relaxed text-stone-dark">
      <OrderOutcome order={order} pay={pay} payEnabled={payEnabled} />
      <OrderDetails order={order} />
    </div>
  );
}
