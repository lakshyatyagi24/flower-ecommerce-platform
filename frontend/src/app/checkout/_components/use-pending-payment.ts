"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiOrder } from "@/lib/api";
import { clearPendingOrder, savePendingOrder } from "@/lib/pending-order";
import { reservedMessage, usePayForOrder, type ExpiredKind } from "@/lib/use-pay-for-order";
import {
  classifyRestoredOrder,
  fetchRestorableOrder,
  forgetPendingOrder,
  readRestoreTarget,
} from "./checkout-logic";
import { amountsOf } from "./checkout-parts";

type PendingAmounts = { total: number; discount: number; couponCode: string | null };

/**
 * Online-payment state. `pendingId` is an order that exists on the server but is not paid yet: while set, the
 * checkout form is not rendered, so a second order can't be created by accident.
 *
 * After auth is known, a remembered unpaid online order is restored into its pending panel (a refresh must not
 * lead to a second order). A signed-in customer reloads it through their account; a guest through the order id
 * and the email kept in sessionStorage (never the URL).
 */
export function usePendingPayment(user: unknown, authLoading: boolean) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [expired, setExpired] = useState<ExpiredKind | null>(null);
  const [restoring, setRestoring] = useState(true);
  // What the server recorded for the pending order (total after any coupon); shown on the pending panel.
  const [pendingAmounts, setPendingAmounts] = useState<PendingAmounts | null>(null);

  // Shared pay/switch/check behaviour: clears the cart and matching pending key itself whenever an order
  // resolves, then we just navigate or show expiry.
  const pay = usePayForOrder({
    orderId: pendingId,
    onResolved: (kind, id, expiredKind) => {
      if (kind !== "expired") {
        router.push(`/checkout/success?orderId=${id}`);
        return;
      }
      setPendingId(null);
      setExpired(expiredKind ?? "unpaid");
      // The restore effect may be the caller: do not leave the skeleton up.
      setRestoring(false);
    },
  });

  const showPending = (o: ApiOrder) => {
    setPendingAmounts(amountsOf(o));
    setPendingId(o.id);
  };

  const applyRestored = (o: ApiOrder) => {
    const kind = classifyRestoredOrder(o);
    if (kind === "done") return pay.applyOrder(o);
    if (kind === "pending") {
      showPending(o);
      pay.setNotice({ text: reservedMessage(o.id), kind: "status" });
      pay.setShowCheck(true);
    } else {
      forgetPendingOrder(Boolean(user));
    }
    setRestoring(false);
  };

  useEffect(() => {
    // Already showing the pending panel for this page view (e.g. the shopper signed in meanwhile): keep it.
    if (authLoading || pendingId !== null) return;
    const target = readRestoreTarget(Boolean(user));
    if (target.kind !== "load") {
      if (target.kind === "drop") clearPendingOrder();
      setRestoring(false);
      return;
    }
    let cancelled = false;
    fetchRestorableOrder(target.id, Boolean(user), target.guestEmail)
      .then((o) => !cancelled && applyRestored(o))
      .catch(() => {
        if (cancelled) return;
        forgetPendingOrder(Boolean(user));
        setRestoring(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  /** An online order was just created: remember it, show its pending panel and open the payment sheet. */
  const beginPending = (o: ApiOrder) => {
    // Keep the cart until payment is confirmed. Remember the order so a refresh shows the pending panel
    // instead of a fresh, submittable form.
    savePendingOrder(o.id);
    showPending(o);
    void pay.payNow(o.id);
  };

  return { pay, pendingId, pendingAmounts, expired, clearExpired: () => setExpired(null), restoring, beginPending };
}
