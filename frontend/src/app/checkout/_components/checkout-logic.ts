import { ApiError, api, type ApiOrder } from "@/lib/api";
import type { CartNotice } from "@/lib/reconcile-cart";
import { validateCheckout } from "@/lib/checkout-validation";
import { validateDeliveryDate, type DeliveryOptions } from "@/lib/delivery-date";
import { clearLastOrderEmail, getLastOrderEmail } from "@/lib/guest-order";
import { clearPendingOrder, readPendingOrderId } from "@/lib/pending-order";
import type { CartItem } from "@/lib/cart-context";
import { ALL_FIELD_ORDER, FIELD_IDS, type CheckoutForm, type FieldName } from "./checkout-parts";

type CreateOrderBody = Parameters<typeof api.createOrder>[0];
export type FieldErrors = Partial<Record<FieldName, string>>;

/** Validation errors for the whole form, including the delivery date judged against the server window. */
export function computeErrors(form: CheckoutForm, deliveryOptions: DeliveryOptions | null): FieldErrors {
  const errors: FieldErrors = validateCheckout(form);
  const dateError = deliveryOptions ? validateDeliveryDate(form.deliveryDate, deliveryOptions) : "Choose a delivery date";
  if (dateError) errors.deliveryDate = dateError;
  return errors;
}

/** The error-summary entries (id to focus + message) for every field that currently shows an error. */
export function buildSummaryItems(fieldError: (k: FieldName) => string | undefined) {
  return ALL_FIELD_ORDER.filter((k) => fieldError(k)).map((k) => ({ id: FIELD_IDS[k], message: fieldError(k) as string }));
}

/** Short live-region text and the submit-gate text for the current blocking / adjusted lines. */
export function summarizeChanges(blockingCount: number, adjustmentCount: number) {
  if (blockingCount > 0) {
    return {
      changesSummary: `${blockingCount === 1 ? "One item" : `${blockingCount} items`} in your bag can't be ordered right now.`,
      gateMessage: "Remove the items that can't be ordered right now to continue.",
    };
  }
  if (adjustmentCount > 0) {
    return {
      changesSummary: `Your order changed: ${adjustmentCount === 1 ? "one update needs" : `${adjustmentCount} updates need`} your review.`,
      gateMessage: "Please review and accept the changes to your order to continue.",
    };
  }
  return { changesSummary: "", gateMessage: null };
}

/** Adds newly found notices, replacing earlier ones for the same product and kind. */
export function mergeNotices(prev: CartNotice[], found: CartNotice[]): CartNotice[] {
  const isReplaced = (p: CartNotice) => found.some((f) => f.productId === p.productId && f.kind === p.kind);
  return [...prev.filter((p) => !isReplaced(p)), ...found];
}

export function buildOrderPayload(
  form: CheckoutForm,
  items: CartItem[],
  paymentMethod: "COD" | "RAZORPAY",
  couponCode: string | undefined,
): CreateOrderBody {
  return {
    items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
    customerName: form.customerName.trim(),
    customerEmail: form.customerEmail.trim(),
    customerPhone: form.customerPhone.trim(),
    shippingAddress: form.shippingAddress.trim(),
    city: form.city.trim(),
    postalCode: form.postalCode.trim(),
    deliveryDate: form.deliveryDate,
    notes: form.notes.trim() || undefined,
    paymentMethod,
    ...(couponCode ? { couponCode } : {}),
  };
}

export function errorMessageOf(err: unknown): string {
  return err instanceof Error ? err.message : "Could not place order";
}

const DATE_REJECTION_RE = /delivery date|deliver on that date/i;
const STOCK_REJECTION_RE = /stock|available|minimum order|enquiry|adjust your cart/i;

/** The server rejected the delivery date: the window moves with the clock, so it must be re-read. */
export const isDateRejection = (message: string) => DATE_REJECTION_RE.test(message);

/** Stock / availability rejected by the server: the bag should be re-read against current data. */
export const isStockRejection = (err: unknown, message: string) =>
  err instanceof ApiError && err.status === 400 && STOCK_REJECTION_RE.test(message);

// ---------- Restoring a remembered unpaid order ----------

export type RestoreTarget = { kind: "none" } | { kind: "drop" } | { kind: "load"; id: number; guestEmail: string | null };

/** What to do on load with the remembered pending order (if any), given whether a customer is signed in. */
export function readRestoreTarget(signedIn: boolean): RestoreTarget {
  const id = readPendingOrderId();
  if (id === null) return { kind: "none" };
  const guestEmail = getLastOrderEmail();
  if (!signedIn && !guestEmail) return { kind: "drop" };
  return { kind: "load", id, guestEmail };
}

const isNotMine = (e: unknown) => e instanceof ApiError && (e.status === 403 || e.status === 404);

/**
 * Signed in meanwhile: the account endpoint first; a guest order is not "mine" (403/404), so fall back to
 * the email it was placed with.
 */
export function fetchRestorableOrder(id: number, signedIn: boolean, guestEmail: string | null): Promise<ApiOrder> {
  if (!signedIn) return api.trackOrder(id, guestEmail as string);
  return api.getMyOrder(id).catch((e: unknown) => {
    if (guestEmail && isNotMine(e)) return api.trackOrder(id, guestEmail);
    throw e;
  });
}

export function classifyRestoredOrder(o: ApiOrder): "done" | "pending" | "drop" {
  // Paid (any status, incl. refund due) or switched to COD: the success page explains the exact state.
  if (o.paymentStatus === "PAID" || o.paymentMethod === "COD") return "done";
  const unpaid = o.paymentStatus === "UNPAID" || o.paymentStatus === "FAILED";
  return o.status === "PENDING" && o.paymentMethod === "RAZORPAY" && unpaid ? "pending" : "drop";
}

/** Forget the remembered order (and, for a guest, the email that unlocked it). */
export function forgetPendingOrder(signedIn: boolean): void {
  clearPendingOrder();
  if (!signedIn) clearLastOrderEmail();
}

// ---------- Which screen to show ----------

export type CheckoutScreenKind =
  | "auth-loading"
  | "restoring"
  | "pending"
  | "expired"
  | "load-error"
  | "options-error"
  | "loading"
  | "empty"
  | "form";

export type ScreenInput = {
  authLoading: boolean;
  restoring: boolean;
  pendingId: number | null;
  expired: boolean;
  count: number;
  settingsError: unknown;
  pricesError: unknown;
  optionsError: unknown;
  optionsLoading: boolean;
  hasOptions: boolean;
  hasSettings: boolean;
  hasPricing: boolean;
  settingsLoading: boolean;
  configLoading: boolean;
};

function screenForCart(s: ScreenInput): CheckoutScreenKind {
  if (s.settingsError || s.pricesError) return "load-error";
  // Full-page states only while there are no options yet, so a reload keeps the form on screen.
  if (!s.hasOptions && (s.optionsError || !s.optionsLoading)) return "options-error";
  const waiting = s.settingsLoading || s.configLoading || !s.hasSettings || !s.hasPricing || !s.hasOptions;
  return waiting ? "loading" : "form";
}

export function resolveScreen(s: ScreenInput): CheckoutScreenKind {
  if (s.authLoading) return "auth-loading";
  if (s.restoring) return "restoring";
  if (s.pendingId !== null) return "pending";
  if (s.expired) return "expired";
  return s.count > 0 ? screenForCart(s) : "empty";
}
