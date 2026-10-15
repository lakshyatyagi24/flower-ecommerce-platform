"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { DEFAULT_MIN_TOTAL, normalizeCouponInput } from "@/lib/coupon";

export type AppliedCoupon = { code: string; discount: number; minTotal: number };

const UNREACHABLE = "We couldn't check that code right now. Please try again.";
const RATE_LIMITED = "Too many attempts. Please wait a minute and try again.";
export const UNCONFIRMED_NOTE = "Discount will be confirmed when you place the order";

/** Subtotal-driven re-checks wait this long after the last change, so quick edits don't burn the 10/min limit. */
export const REVALIDATE_DEBOUNCE_MS = 400;

/**
 * Coupon state for the checkout. The numbers here are a PREVIEW: the server re-validates the code and recomputes
 * the discount from its own prices when the order is created, and the order it returns is what is charged.
 *
 * - `apply` checks the typed code against the current (pre-discount) subtotal.
 * - While a coupon is applied it is re-checked (debounced) whenever the subtotal changes; a coupon that stops being
 *   valid is dropped with the reason (never silently kept).
 * - If a re-check cannot be completed (offline, rate limited) the coupon is kept but `unconfirmed` is set and the
 *   preview amount is hidden (`discount` is 0): the server decides when the order is placed.
 * - `reject(message)` drops the coupon after the server refused it at order time.
 */
export function useCoupon(subtotal: number) {
  const [input, setInput] = useState("");
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [checkedFor, setCheckedFor] = useState<number | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const seq = useRef(0);

  const apply = useCallback(async () => {
    const code = normalizeCouponInput(input);
    if (!code) {
      setError("Enter a coupon code.");
      return false;
    }
    const mine = ++seq.current;
    setBusy(true);
    setError(null);
    try {
      const res = await api.validateCoupon(code, subtotal);
      if (mine !== seq.current) return false;
      setCheckedFor(subtotal);
      setUnconfirmed(false);
      setApplied({ code: res.code, discount: res.discount, minTotal: res.minTotal ?? DEFAULT_MIN_TOTAL });
      setInput("");
      setAnnouncement(`Coupon ${res.code} applied.`);
      return true;
    } catch (err) {
      if (mine !== seq.current) return false;
      setError(
        err instanceof ApiError && err.status === 400
          ? err.message
          : err instanceof ApiError && err.status === 429
            ? RATE_LIMITED
            : UNREACHABLE,
      );
      return false;
    } finally {
      if (mine === seq.current) setBusy(false);
    }
  }, [input, subtotal]);

  const remove = useCallback(() => {
    seq.current++;
    setApplied((a) => {
      if (a) setAnnouncement(`Coupon ${a.code} removed.`);
      return null;
    });
    setError(null);
    setBusy(false);
    setCheckedFor(null);
    setUnconfirmed(false);
  }, []);

  /** The server refused the coupon when the order was created: drop it and keep the reason visible. */
  const reject = useCallback((message: string) => {
    seq.current++;
    setApplied(null);
    setBusy(false);
    setCheckedFor(null);
    setUnconfirmed(false);
    setError(message);
    setAnnouncement(`Coupon removed. ${message}`);
  }, []);

  // Re-validate (debounced) when the subtotal moves under an applied coupon (cart edit, price change).
  useEffect(() => {
    if (!applied || checkedFor === subtotal) return;
    const code = applied.code;
    const timer = setTimeout(() => {
      const mine = ++seq.current;
      setBusy(true);
      api
        .validateCoupon(code, subtotal)
        .then((res) => {
          if (mine !== seq.current) return;
          setCheckedFor(subtotal);
          setUnconfirmed(false);
          setApplied({ code: res.code, discount: res.discount, minTotal: res.minTotal ?? DEFAULT_MIN_TOTAL });
        })
        .catch((err: unknown) => {
          if (mine !== seq.current) return;
          if (err instanceof ApiError && err.status === 400) {
            // No longer valid for this cart (below the minimum, expired, used up...): say so and drop it.
            setApplied(null);
            setCheckedFor(null);
            setUnconfirmed(false);
            setError(err.message);
            setAnnouncement(`Coupon ${code} removed. ${err.message}`);
          } else {
            // Offline or rate limited: keep the coupon, but do not show an amount we could not confirm.
            setCheckedFor(subtotal);
            setUnconfirmed(true);
            setAnnouncement(`${UNCONFIRMED_NOTE}.`);
          }
        })
        .finally(() => {
          if (mine === seq.current) setBusy(false);
        });
    }, REVALIDATE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [applied, subtotal, checkedFor]);

  // A subtotal of 0 (empty bag) can't carry a coupon.
  useEffect(() => {
    if (applied && subtotal <= 0) remove();
  }, [applied, subtotal, remove]);

  // A re-check is owed (waiting out the debounce, or in flight): treat the coupon as busy so Place order waits.
  const pending = applied !== null && checkedFor !== subtotal;
  const discount = applied && !unconfirmed ? Math.min(applied.discount, Math.max(subtotal, 0)) : 0;

  return { input, setInput, applied, discount, unconfirmed, error, busy: busy || pending, announcement, apply, remove, reject };
}
