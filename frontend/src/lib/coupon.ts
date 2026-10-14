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
 * Mirror of the server's allocateDiscount (backend src/coupons/discount-tax.ts): spread the discount over the lines
 * in proportion; the last line takes the rounding remainder so the parts add up to the discount exactly.
 */
export function allocateDiscount(lineTotals: number[], discount: number): number[] {
  const bases = lineTotals.map(round2);
  const subtotal = bases.reduce((s, b) => s + b, 0);
  if (!(discount > 0) || !(subtotal > 0) || bases.length === 0) return bases.map(() => 0);
  const out: number[] = [];
  let allocated = 0;
  bases.forEach((b, i) => {
    if (i === bases.length - 1) {
      out.push(round2(discount - allocated));
    } else {
      const part = round2((discount * b) / subtotal);
      out.push(part);
      allocated += part;
    }
  });
  return out;
}

/** GST per line on the value AFTER the discount (same rule and rounding as the server). */
export function gstPerLine(lines: TaxLine[], discount: number): number[] {
  const alloc = allocateDiscount(lines.map((l) => l.lineTotal), discount);
  return lines.map((l, i) => round2((Math.max(round2(l.lineTotal) - alloc[i], 0) * (l.gstRate || 0)) / 100));
}

export function gstAfterDiscount(lines: TaxLine[], discount: number): number {
  return round2(gstPerLine(lines, discount).reduce((a, b) => a + b, 0));
}
