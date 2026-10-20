import { ApiError, api, type ApiOrder } from "@/lib/api";

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

/** How a freshly loaded order settles the pay flow (null: it is still waiting for payment). */
export function resolutionOf(o: ApiOrder): "paid" | "refund" | "expired" | "cod" | null {
  if (o.paymentStatus === "PAID") return o.status === "CANCELLED" ? "refund" : "paid";
  if (o.status === "CANCELLED" || o.paymentStatus === "REFUNDED") return "expired";
  return o.paymentMethod === "COD" ? "cod" : null;
}

const isNotMine = (e: unknown) => e instanceof ApiError && (e.status === 403 || e.status === 404);

/**
 * Signed in: the account endpoint, falling back to the guest email when the order is not "mine" (a guest order
 * viewed after signing in). Guests need the email kept in sessionStorage.
 */
export async function fetchOrderForPay(oid: number, signedIn: boolean, email: string | undefined): Promise<ApiOrder> {
  if (!signedIn) {
    if (!email) throw new Error(GUEST_NO_EMAIL_COPY);
    return api.trackOrder(oid, email);
  }
  try {
    return await api.getMyOrder(oid);
  } catch (e) {
    if (email && isNotMine(e)) return api.trackOrder(oid, email);
    throw e;
  }
}

export const stillPendingNotice = (oid: number): Notice => ({
  text: `Your order #${oid} is still pending and has not been paid yet. It is reserved for 30 minutes.`,
  kind: "status",
});

const messageOr = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

export const checkFailureNotice = (err: unknown): Notice => ({
  text: messageOr(err, "Could not check the order status"),
  kind: "alert",
});

/** The notice for a failed switch to COD, and whether Check status should be offered (the order moved on: 409). */
export function switchFailure(err: unknown): { notice: Notice; showCheck: boolean } {
  if (err instanceof ApiError && err.status === 409) {
    return { notice: { text: "This order can no longer be switched. Press Check status.", kind: "alert" }, showCheck: true };
  }
  return { notice: { text: messageOr(err, "Could not switch to cash on delivery"), kind: "alert" }, showCheck: false };
}
