"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { normalizeCouponInput } from "@/lib/coupon";

export type AppliedCoupon = { code: string; discount: number };

const UNREACHABLE = "We couldn't check that code right now. Please try again.";
const RATE_LIMITED = "Too many attempts. Please wait a minute and try again.";

/**
 * Coupon state for the checkout. The numbers here are a PREVIEW: the server re-validates the code and recomputes
 * the discount from its own prices when the order is created, and the order it returns is what is charged.
 *
 * - `apply` checks the typed code against the current (pre-discount) subtotal.
 * - While a coupon is applied it is re-checked whenever the subtotal changes; a coupon that stops being valid is
 *   dropped with the reason (never silently kept).
 * - `reject(message)` drops the coupon after the server refused it at order time.
 */
export function useCoupon(subtotal: number) {
  const [input, setInput] = useState("");
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const seq = useRef(0);
  const checkedFor = useRef<number | null>(null);

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
      checkedFor.current = subtotal;
      setApplied({ code: res.code, discount: res.discount });
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
    checkedFor.current = null;
  }, []);

  /** The server refused the coupon when the order was created: drop it and keep the reason visible. */
  const reject = useCallback((message: string) => {
    seq.current++;
    setApplied(null);
    setBusy(false);
    checkedFor.current = null;
    setError(message);
    setAnnouncement(`Coupon removed. ${message}`);
  }, []);

  // Re-validate when the subtotal moves under an applied coupon (cart edit, price change).
  useEffect(() => {
    if (!applied || checkedFor.current === subtotal) return;
    const code = applied.code;
    const mine = ++seq.current;
    setBusy(true);
    api
      .validateCoupon(code, subtotal)
      .then((res) => {
        if (mine !== seq.current) return;
        checkedFor.current = subtotal;
        setApplied({ code: res.code, discount: res.discount });
      })
      .catch((err: unknown) => {
        if (mine !== seq.current) return;
        if (err instanceof ApiError && err.status === 400) {
          // No longer valid for this cart (below the minimum, expired, used up...): say so and drop it.
          setApplied(null);
          checkedFor.current = null;
          setError(err.message);
          setAnnouncement(`Coupon ${code} removed. ${err.message}`);
        } else {
          // Offline or rate limited: keep the coupon; the server decides when the order is created.
          checkedFor.current = subtotal;
        }
      })
      .finally(() => {
        if (mine === seq.current) setBusy(false);
      });
  }, [applied, subtotal]);

  // A subtotal of 0 (empty bag) can't carry a coupon.
  useEffect(() => {
    if (applied && subtotal <= 0) remove();
  }, [applied, subtotal, remove]);

  const discount = applied ? Math.min(applied.discount, Math.max(subtotal, 0)) : 0;

  return { input, setInput, applied, discount, error, busy, announcement, apply, remove, reject };
}
