"use client";

import { useRef, useState } from "react";
import { ApiError, api, type ApiOrder } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { clearLastOrderEmail, getLastOrderEmail } from "@/lib/guest-order";
import { resolveOrderLocally } from "@/lib/pending-order";
import { payForOrder, type PayHandlers } from "@/lib/razorpay-flow";

export type ResolveKind = "paid" | "refund" | "cod" | "expired";
export type ExpiredKind = "unpaid" | "refunded" | "cancelled";
export type Notice = { text: string; kind: "alert" | "status"; link?: { href: string; label: string } };

export const SWITCHED_REFUND_COPY =
  "We received your online payment, but this order had already been switched to cash on delivery. We will refund your payment within 3-5 working days — contact us if you don't hear from us.";

export const reservedMessage = (id: number) =>
  `If you completed the payment in your UPI or banking app, wait a minute and press Check status before switching. Your order #${id} is reserved for 30 minutes.`;

export const GUEST_NO_EMAIL_COPY =
  "We can't look up this order from here any more. Use Track order with your order number and the email you ordered with.";

export const EXPIRED_COPY: Record<ExpiredKind, string> = {
  unpaid: "This order expired because payment was not completed. Nothing was charged.",
  refunded: "Your payment was refunded.",
  cancelled: "This order was cancelled.",
};

export function expiredKindOf(o: Pick<ApiOrder, "paymentStatus" | "paymentMethod">): ExpiredKind {
  if (o.paymentStatus === "REFUNDED") return "refunded";
  if (o.paymentMethod === "COD") return "cancelled";
  return "unpaid";
}

export type UsePayForOrderOptions = {
  orderId: number | null;
  /** Called after the cart and pending-order key were cleaned up (or, for "expired", after the key was cleared). */
  onResolved?: (kind: ResolveKind, orderId: number, expired?: ExpiredKind) => void;
};

/**
 * One owner of the "pay for / switch / check status" behaviour used by the
 * checkout page, the success page and My Orders. Whenever an order resolves
 * (paid, refund due, switched to COD) the cart and a matching `fp_pending_order`
 * key are cleared before the page-specific callback runs.
 */
export function usePayForOrder({ orderId, onResolved }: UsePayForOrderOptions) {
  const { clear } = useCart();
  const { user } = useAuth();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showCheck, setShowCheck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // The customer paid online on an order that was already switched to COD: a refund is due.
  const [switched, setSwitched] = useState(false);
  const cb = useRef(onResolved);
  cb.current = onResolved;
  const idOf = (id?: number) => (id ?? orderId) as number;
  // The email of an order placed as a guest (sessionStorage, never the URL). It is passed even after the shopper
  // signs in mid-flow: a guest order (no owner) is reachable by that email with or without a token, while an
  // account order ignores it and needs the token.
  const guestEmail = (): string | undefined => getLastOrderEmail() ?? undefined;
  const fetchOrder = async (oid: number): Promise<ApiOrder> => {
    const email = guestEmail();
    if (user) {
      try {
        return await api.getMyOrder(oid);
      } catch (e) {
        // Signed in after placing a guest order: it is not "mine", so read it the guest way instead.
        if (email && e instanceof ApiError && (e.status === 403 || e.status === 404)) return api.trackOrder(oid, email);
        throw e;
      }
    }
    if (!email) throw new Error(GUEST_NO_EMAIL_COPY);
    return api.trackOrder(oid, email);
  };

  const resolve = (id: number, kind: "paid" | "refund" | "cod") => {
    clear();
    resolveOrderLocally(id);
    setConfirming(false);
    cb.current?.(kind, id);
  };

  /** Applies a freshly loaded order. Returns true when it resolved the flow. */
  const applyOrder = (o: ApiOrder): boolean => {
    const cancelled = o.status === "CANCELLED";
    if (o.paymentStatus === "PAID") {
      resolve(o.id, cancelled ? "refund" : "paid");
      return true;
    }
    if (cancelled || o.paymentStatus === "REFUNDED") {
      resolveOrderLocally(o.id);
      if (!user) clearLastOrderEmail(); // nothing left to pay or check: the guest key is spent
      setConfirming(false);
      cb.current?.("expired", o.id, expiredKindOf(o));
      return true;
    }
    if (o.paymentMethod === "COD") {
      resolve(o.id, "cod");
      return true;
    }
    return false;
  };

  const handlers = (id: number): PayHandlers => ({
    onPaid: () => resolve(id, "paid"),
    onRefundDue: (kind) => {
      if (kind === "switched") {
        // The COD order exists, so the cart and pending key are done with. Do NOT navigate to a success
        // page that says "pay on delivery": keep the page and explain the refund inline.
        clear();
        resolveOrderLocally(id);
        if (!user) clearLastOrderEmail();
        setConfirming(false);
        setShowCheck(false);
        setSwitched(true);
        setNotice({ text: SWITCHED_REFUND_COPY, kind: "status", link: { href: "/account/orders", label: "My Orders" } });
        return;
      }
      resolve(id, "refund");
    },
    onDismiss: () => {
      setNotice({ text: reservedMessage(id), kind: "status" });
      setShowCheck(true);
    },
    onFailure: () => {
      setNotice({ text: reservedMessage(id), kind: "alert" });
      setShowCheck(true);
    },
    onVerifyError: (msg) => {
      setNotice({ text: msg, kind: "alert" });
      setShowCheck(true);
    },
    // Includes a 400 for a cancelled/expired order: Check status resolves it.
    onError: (msg) => {
      setNotice({ text: msg, kind: "alert" });
      setShowCheck(true);
    },
  });

  const payNow = (id?: number) => {
    const oid = idOf(id);
    setNotice(null);
    setConfirming(false);
    return payForOrder(oid, handlers(oid), guestEmail());
  };

  const checkStatus = async (id?: number) => {
    const oid = idOf(id);
    if (busy) return;
    setBusy(true);
    try {
      const o = await fetchOrder(oid);
      if (!applyOrder(o)) {
        setNotice({
          text: `Your order #${oid} is still pending and has not been paid yet. It is reserved for 30 minutes.`,
          kind: "status",
        });
      }
    } catch (err) {
      setNotice({ text: err instanceof Error && err.message ? err.message : "Could not check the order status", kind: "alert" });
    } finally {
      setBusy(false);
    }
  };

  const confirmSwitch = async (id?: number) => {
    const oid = idOf(id);
    if (busy) return;
    setBusy(true);
    setConfirming(false);
    try {
      // Re-check first: a payment may have completed while the modal was closed.
      const o = await fetchOrder(oid);
      if (applyOrder(o)) return;
      await api.setOrderPaymentMethod(oid, guestEmail() ?? user?.email);
      resolve(oid, "cod");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNotice({ text: "This order can no longer be switched. Press Check status.", kind: "alert" });
        setShowCheck(true);
      } else {
        setNotice({
          text: err instanceof Error && err.message ? err.message : "Could not switch to cash on delivery",
          kind: "alert",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return {
    notice,
    setNotice,
    showCheck,
    setShowCheck,
    busy,
    confirming,
    switched,
    askSwitch: () => setConfirming(true),
    cancelSwitch: () => setConfirming(false),
    payNow,
    checkStatus,
    confirmSwitch,
    applyOrder,
  };
}

export type PayController = ReturnType<typeof usePayForOrder>;
