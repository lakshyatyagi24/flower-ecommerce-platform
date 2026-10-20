"use client";

import { useRef, useState } from "react";
import { api, type ApiOrder } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { clearLastOrderEmail, getLastOrderEmail } from "@/lib/guest-order";
import { resolveOrderLocally } from "@/lib/pending-order";
import { payForOrder, type PayHandlers } from "@/lib/razorpay-flow";
import {
  checkFailureNotice,
  expiredKindOf,
  fetchOrderForPay,
  reservedMessage,
  resolutionOf,
  stillPendingNotice,
  SWITCHED_REFUND_COPY,
  switchFailure,
  type ExpiredKind,
  type Notice,
  type ResolveKind,
} from "./pay-order/logic";

// The copy and the pure order rules live in ./pay-order/logic; they are re-exported so imports stay stable.
export {
  EXPIRED_COPY,
  expiredKindOf,
  GUEST_NO_EMAIL_COPY,
  reservedMessage,
  SWITCHED_REFUND_COPY,
} from "./pay-order/logic";
export type { ExpiredKind, Notice, ResolveKind } from "./pay-order/logic";

export type UsePayForOrderOptions = {
  orderId: number | null;
  /** Called after the cart and pending-order key were cleaned up (or, for "expired", after the key was cleared). */
  onResolved?: (kind: ResolveKind, orderId: number, expired?: ExpiredKind) => void;
};

function usePayState() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showCheck, setShowCheck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // The customer paid online on an order that was already switched to COD: a refund is due.
  const [switched, setSwitched] = useState(false);
  return { notice, setNotice, showCheck, setShowCheck, busy, setBusy, confirming, setConfirming, switched, setSwitched };
}

type PayState = ReturnType<typeof usePayState>;
type Notify = Pick<PayState, "setNotice" | "setShowCheck">;

/** Shows `notice` and offers Check status, the way every payment problem is reported. */
const raise = (s: Notify, notice: Notice) => {
  s.setNotice(notice);
  s.setShowCheck(true);
};

/** The email of an order placed as a guest (sessionStorage, never the URL). It is passed even after the shopper
 * signs in mid-flow: a guest order (no owner) is reachable by that email with or without a token, while an
 * account order ignores it and needs the token. */
const guestEmail = (): string | undefined => getLastOrderEmail() ?? undefined;

/** `busy` guards against overlapping status checks / switches. */
async function whileBusy(s: PayState, work: () => Promise<void>) {
  if (s.busy) return;
  s.setBusy(true);
  try {
    await work();
  } finally {
    s.setBusy(false);
  }
}

/** Cleans up after an order resolves (cart, pending key, confirm box) and reports it to the page. */
function useResolvers(s: PayState, onResolved: UsePayForOrderOptions["onResolved"]) {
  const { clear } = useCart();
  const { user } = useAuth();
  const cb = useRef(onResolved);
  cb.current = onResolved;

  const resolve = (id: number, kind: "paid" | "refund" | "cod") => {
    clear();
    resolveOrderLocally(id);
    s.setConfirming(false);
    cb.current?.(kind, id);
  };

  const expire = (o: ApiOrder) => {
    resolveOrderLocally(o.id);
    if (!user) clearLastOrderEmail(); // nothing left to pay or check: the guest key is spent
    s.setConfirming(false);
    cb.current?.("expired", o.id, expiredKindOf(o));
  };

  /** Applies a freshly loaded order. Returns true when it resolved the flow. */
  const applyOrder = (o: ApiOrder): boolean => {
    const outcome = resolutionOf(o);
    if (outcome === null) return false;
    if (outcome === "expired") expire(o);
    else resolve(o.id, outcome);
    return true;
  };

  // The COD order exists, so the cart and pending key are done with. Do NOT navigate to a success page that says
  // "pay on delivery": keep the page and explain the refund inline.
  const settleSwitched = (id: number) => {
    clear();
    resolveOrderLocally(id);
    if (!user) clearLastOrderEmail();
    s.setConfirming(false);
    s.setShowCheck(false);
    s.setSwitched(true);
    s.setNotice({ text: SWITCHED_REFUND_COPY, kind: "status", link: { href: "/account/orders", label: "My Orders" } });
  };

  return { user, resolve, applyOrder, settleSwitched };
}

type Resolvers = ReturnType<typeof useResolvers>;

function payHandlers(id: number, s: PayState, r: Resolvers): PayHandlers {
  const failed = (text: string) => raise(s, { text, kind: "alert" });
  return {
    onPaid: () => r.resolve(id, "paid"),
    onRefundDue: (kind) => (kind === "switched" ? r.settleSwitched(id) : r.resolve(id, "refund")),
    onDismiss: () => raise(s, { text: reservedMessage(id), kind: "status" }),
    onFailure: () => failed(reservedMessage(id)),
    onVerifyError: failed,
    // Includes a 400 for a cancelled/expired order: Check status resolves it.
    onError: failed,
  };
}

/**
 * One owner of the "pay for / switch / check status" behaviour used by the
 * checkout page, the success page and My Orders. Whenever an order resolves
 * (paid, refund due, switched to COD) the cart and a matching `fp_pending_order`
 * key are cleared before the page-specific callback runs.
 */
export function usePayForOrder({ orderId, onResolved }: UsePayForOrderOptions) {
  const s = usePayState();
  const r = useResolvers(s, onResolved);
  const idOf = (id?: number) => (id ?? orderId) as number;
  const fetchOrder = (oid: number) => fetchOrderForPay(oid, Boolean(r.user), guestEmail());

  const payNow = (id?: number) => {
    const oid = idOf(id);
    s.setNotice(null);
    s.setConfirming(false);
    return payForOrder(oid, payHandlers(oid, s, r), guestEmail());
  };

  const checkStatus = (id?: number) =>
    whileBusy(s, async () => {
      const oid = idOf(id);
      try {
        if (!r.applyOrder(await fetchOrder(oid))) s.setNotice(stillPendingNotice(oid));
      } catch (err) {
        s.setNotice(checkFailureNotice(err));
      }
    });

  const confirmSwitch = (id?: number) =>
    whileBusy(s, async () => {
      const oid = idOf(id);
      s.setConfirming(false);
      try {
        // Re-check first: a payment may have completed while the modal was closed.
        if (r.applyOrder(await fetchOrder(oid))) return;
        await api.setOrderPaymentMethod(oid, guestEmail() ?? r.user?.email);
        r.resolve(oid, "cod");
      } catch (err) {
        const failure = switchFailure(err);
        s.setNotice(failure.notice);
        if (failure.showCheck) s.setShowCheck(true);
      }
    });

  return {
    notice: s.notice,
    setNotice: s.setNotice,
    showCheck: s.showCheck,
    setShowCheck: s.setShowCheck,
    busy: s.busy,
    confirming: s.confirming,
    switched: s.switched,
    askSwitch: () => s.setConfirming(true),
    cancelSwitch: () => s.setConfirming(false),
    payNow,
    checkStatus,
    confirmSwitch,
    applyOrder: r.applyOrder,
  };
}

export type PayController = ReturnType<typeof usePayForOrder>;
