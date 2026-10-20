import { ApiError, api, type ApiOrder } from "@/lib/api";

export const RESERVED_NOTE =
  "Your order is reserved for 30 minutes from when it was placed. After that it is cancelled automatically.";

export const GUEST_LOOKUP_COPY =
  "We couldn't show your order details here, but if you completed checkout your order was placed. Check your confirmation email, or look it up with your order number and the email you ordered with.";

export type Outcome = "refund-expired" | "cancelled" | "pending" | "paid-online" | "cod" | "processing";

const isUnpaid = (o: ApiOrder) => o.paymentStatus === "UNPAID" || o.paymentStatus === "FAILED";

/** An online order that has not been paid yet: Pay now, Check status and Switch to COD still apply. */
export const isStillPayable = (o: ApiOrder) => o.paymentMethod === "RAZORPAY" && o.status === "PENDING" && isUnpaid(o);

export function outcomeOf(order: ApiOrder): Outcome {
  const online = order.paymentMethod === "RAZORPAY";
  const cancelled = order.status === "CANCELLED";
  const paid = order.paymentStatus === "PAID";
  if (cancelled) return paid ? "refund-expired" : "cancelled";
  if (isStillPayable(order)) return "pending";
  if (!online) return "cod";
  return paid ? "paid-online" : "processing";
}

const isNotMine = (e: unknown) => e instanceof ApiError && (e.status === 403 || e.status === 404);

/**
 * A signed-in customer reads the order through their account; a guest with the order's email. A guest order viewed
 * after signing in is not "mine" (403/404), so it falls back to the email (reported through `onViaEmail`).
 */
export async function fetchSummaryOrder(
  orderId: number,
  signedIn: boolean,
  guestEmail: string | null,
  onViaEmail: () => void,
): Promise<ApiOrder> {
  if (!signedIn && guestEmail) return api.trackOrder(orderId, guestEmail);
  try {
    return await api.getMyOrder(orderId);
  } catch (e) {
    if (!guestEmail || !isNotMine(e)) throw e;
    onViaEmail();
    return api.trackOrder(orderId, guestEmail);
  }
}
