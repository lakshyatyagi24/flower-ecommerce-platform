"use client";

import React, { useRef, useState } from "react";
import { api, type ApiOrder } from "@/lib/api";
import type { CartItem } from "@/lib/cart-context";
import { isCouponError } from "@/lib/coupon";
import { fetchFreshProducts } from "@/lib/fresh-products";
import { setLastOrderEmail } from "@/lib/guest-order";
import { clearPendingOrder } from "@/lib/pending-order";
import {
  adjustmentNotices,
  applyReconciled,
  blockingNotices,
  linesChanged,
  reconcileCart,
  type CartNotice,
} from "@/lib/reconcile-cart";
import { useRouter } from "next/navigation";
import { buildOrderPayload, errorMessageOf, isDateRejection, isStockRejection, type FieldErrors } from "./checkout-logic";
import type { CheckoutForm, FieldName } from "./checkout-parts";

const BLOCKING_CHANGED = "Some items in your bag can't be ordered right now. Remove them to continue.";
const PRICES_CHANGED =
  "Some prices or quantities changed while you were checking out. Review the changes and accept them to continue.";
const COUPON_REMOVED =
  "Your coupon could not be applied, so it was removed and no order was placed. Check the total and place the order again.";

type PinCheck = { pin: string; status: "ok" | "no" | "unknown"; message: string } | null;

export type SubmitDeps = {
  form: CheckoutForm;
  errors: FieldErrors;
  blockMessage: string | null;
  paymentMethod: "COD" | "RAZORPAY";
  isSignedIn: boolean;
  items: CartItem[];
  couponCode: string | undefined;
  rejectCoupon: (message: string) => void;
  pinCheck: PinCheck;
  checkPin: (pin: string) => Promise<PinCheck>;
  setPinFocusTick: React.Dispatch<React.SetStateAction<number>>;
  setTouched: React.Dispatch<React.SetStateAction<Partial<Record<FieldName, boolean>>>>;
  setAttempted: (v: boolean) => void;
  bumpFocus: () => void;
  clearCart: () => void;
  replaceWith: (update: (prev: CartItem[]) => CartItem[]) => void;
  noteAdjustments: (found: CartNotice[]) => void;
  reloadPrices: () => void;
  reloadOptions: () => void;
  beginPending: (order: ApiOrder) => void;
};

/**
 * Last look before money moves: prices and stock may have changed while the form was open. Anything that
 * changed is applied and shown for the shopper to accept first; the server still computes the real total.
 * Returns the message to show when the order must not go out yet, else null.
 */
async function recheckPrices(d: SubmitDeps): Promise<string | null> {
  const latest = await fetchFreshProducts(d.items, { maxAgeMs: 0 });
  if (latest.failed) return null;
  const result = reconcileCart(d.items, latest.fresh);
  const newBlocking = blockingNotices(result.notices);
  const newAdjustments = adjustmentNotices(result.notices);
  if (linesChanged(d.items, result.lines)) d.replaceWith((prev) => applyReconciled(prev, d.items, result.lines));
  d.noteAdjustments(newAdjustments);
  if (newBlocking.length > 0) return BLOCKING_CHANGED;
  return newAdjustments.length > 0 ? PRICES_CHANGED : null;
}

/** Resolves the PIN's serviceability, reusing the last answer for the same PIN when it was conclusive. */
async function pinIsUnserviceable(d: SubmitDeps): Promise<boolean> {
  const pin = d.form.postalCode.trim();
  const last = d.pinCheck;
  const known = last && last.pin === pin && last.status !== "unknown" ? last : await d.checkPin(pin);
  return known?.status === "no";
}

function useGoToSuccess(clearCart: () => void) {
  const router = useRouter();
  return (id: number) => {
    clearCart();
    clearPendingOrder();
    router.push(`/checkout/success?orderId=${id}`);
  };
}

/** Validation, price re-check and order creation behind the "Place order" button. */
export function useCheckoutSubmit(d: SubmitDeps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const goToSuccess = useGoToSuccess(d.clearCart);

  const fail = (message: string) => {
    setError(message);
    d.bumpFocus();
  };

  const createOrder = async () => {
    const order = await api.createOrder(buildOrderPayload(d.form, d.items, d.paymentMethod, d.couponCode));
    // A guest finds their order again (pay, switch, success page) with the email they ordered with.
    if (!d.isSignedIn) setLastOrderEmail(d.form.customerEmail.trim());
    if (d.paymentMethod === "COD") goToSuccess(order.id);
    else d.beginPending(order);
  };

  const placeOrder = async () => {
    if (await pinIsUnserviceable(d)) {
      d.setTouched((t) => ({ ...t, postalCode: true }));
      d.setPinFocusTick((t) => t + 1);
      return;
    }
    const stale = await recheckPrices(d);
    if (stale) {
      d.reloadPrices();
      fail(stale);
      return;
    }
    await createOrder();
  };

  const handleFailure = (err: unknown) => {
    const message = errorMessageOf(err);
    if (isCouponError(err)) {
      // The server refused the coupon (expired, used up, below its minimum...). Drop it, say why next to the
      // field, and let the shopper decide: the order is NOT retried without it.
      d.rejectCoupon(message);
      fail(COUPON_REMOVED);
      return;
    }
    // The window moves with the clock (cut-off time): after a date rejection, re-read it.
    if (isDateRejection(message)) d.reloadOptions();
    // Stock / availability rejected by the server: re-read the bag so the shopper sees which lines to fix.
    if (isStockRejection(err, message)) d.reloadPrices();
    fail(message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError(null);
    d.setAttempted(true);
    if (Object.keys(d.errors).length > 0) return d.bumpFocus();
    if (d.blockMessage) return fail(d.blockMessage);
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await placeOrder();
    } catch (err) {
      handleFailure(err);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return { submitting, error, handleSubmit };
}
