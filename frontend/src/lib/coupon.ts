/** Round half-up to paise, the same rule the server uses for every persisted amount. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Order total as the server computes it (R19): subtotal - discount + shipping + GST. Free shipping and the
 * coupon minimum were already judged on the pre-discount subtotal; GST stays on the undiscounted lines.
 */
export function totalAfterDiscount(subtotal: number, discount: number, shipping: number, gst: number): number {
  return round2(subtotal - discount + shipping + gst);
}

/** The server flags every coupon problem with `field: "couponCode"` so it can be told apart from other 400s. */
export function isCouponError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const payload = (err as { payload?: unknown }).payload;
  return Boolean(payload && typeof payload === 'object' && (payload as { field?: unknown }).field === 'couponCode');
}

/** Typed codes are upper-cased and stripped of spaces, like the server's normalisation. */
export function normalizeCouponInput(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}
