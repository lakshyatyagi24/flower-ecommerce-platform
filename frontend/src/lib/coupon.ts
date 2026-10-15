/** Round half-up to paise, the same rule the server uses for every persisted amount. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Order total as the server computes it (R19): subtotal - discount + shipping + GST, where the GST is already
 * computed on the discounted value (see gstAfterDiscount). Free shipping and the coupon minimum are judged on the
 * pre-discount subtotal.
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

export interface TaxLine {
  /** price * quantity of one cart line, before any discount. */
  lineTotal: number;
  /** GST percentage of the line (0 when none). */
  gstRate: number;
}

/**
 * Mirror of the server's allocateDiscount (backend src/coupons/discount-tax.ts), in whole paise: each line gets
 * floor(discount * line / subtotal); the leftover paise go to the LARGEST line (ties: the later one), every share is
 * clamped to [0, line value], and whatever does not fit moves to the next largest line with room. The shares add up
 * to the discount exactly (itself clamped to the subtotal). Pinned by the same fixtures as the server.
 */
export function allocateDiscount(lineTotals: number[], discount: number): number[] {
  const cents = lineTotals.map((l) => Math.max(Math.round(round2(l) * 100), 0));
  const subtotal = cents.reduce((s, c) => s + c, 0);
  const want = Math.min(Math.max(Math.round(round2(discount) * 100), 0), subtotal);
  if (want === 0 || subtotal === 0) return cents.map(() => 0);
  const share = cents.map((c) => Math.floor((want * c) / subtotal));
  let left = want - share.reduce((s, x) => s + x, 0);
  const order = cents.map((_, i) => i).sort((a, b) => cents[b] - cents[a] || b - a);
  for (const i of order) {
    if (left <= 0) break;
    const add = Math.min(left, cents[i] - share[i]);
    share[i] += add;
    left -= add;
  }
  return share.map((x) => x / 100);
}

/** GST per line on the value AFTER the discount (same rule and rounding as the server). */
export function gstPerLine(lines: TaxLine[], discount: number): number[] {
  const alloc = allocateDiscount(lines.map((l) => l.lineTotal), discount);
  return lines.map((l, i) => round2((Math.max(round2(l.lineTotal) - alloc[i], 0) * (l.gstRate || 0)) / 100));
}

export function gstAfterDiscount(lines: TaxLine[], discount: number): number {
  return round2(gstPerLine(lines, discount).reduce((a, b) => a + b, 0));
}

/** Lowest total a discounted order may have; the server sends the real value as `minTotal` with the preview. */
export const DEFAULT_MIN_TOTAL = 1;

export function belowFloorMessage(minTotal: number): string {
  return `This coupon would bring your total below ₹${minTotal}. Add more items to use it.`;
}
