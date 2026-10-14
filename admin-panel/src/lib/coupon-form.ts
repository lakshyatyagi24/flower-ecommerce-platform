import type { AdminCoupon, AdminCouponInput } from './api';

export type CouponFormState = {
  code: string;
  type: 'PERCENT' | 'FLAT';
  value: string;
  minSubtotal: string;
  maxDiscount: string;
  /** `YYYY-MM-DD` (India date) or ''. The coupon is valid through the end of that day. */
  expiresOn: string;
  maxUses: string;
  active: boolean;
};

export const blankCouponForm = (): CouponFormState => ({
  code: '', type: 'PERCENT', value: '', minSubtotal: '', maxDiscount: '', expiresOn: '', maxUses: '', active: true,
});

export const normalizeCode = (raw: string): string => raw.replace(/\s+/g, '').toUpperCase();

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Stored expiry instant -> the India calendar date it falls on (`YYYY-MM-DD`). */
export function expiryToDateInput(iso: string | null): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '';
  return new Date(t + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** India date -> the last instant of that day (so "expires 31 Dec" works through 31 Dec). */
export function dateInputToExpiry(date: string): string | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T23:59:59.999+05:30` : null;
}

export function couponToForm(c: AdminCoupon): CouponFormState {
  return {
    code: c.code,
    type: c.type,
    value: String(c.value),
    minSubtotal: c.minSubtotal ? String(c.minSubtotal) : '',
    maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : '',
    expiresOn: expiryToDateInput(c.expiresAt),
    maxUses: c.maxUses != null ? String(c.maxUses) : '',
    active: c.active,
  };
}

export type CouponErrors = Partial<Record<'code' | 'value' | 'minSubtotal' | 'maxDiscount' | 'maxUses' | 'expiresOn', string>>;

const num = (s: string): number => (s.trim() === '' ? NaN : Number(s));

/** Mirrors the server rules so mistakes show next to the field; the server stays authoritative. */
export function validateCouponForm(f: CouponFormState, isNew: boolean): CouponErrors {
  const e: CouponErrors = {};
  if (isNew && !/^[A-Z0-9_-]{3,32}$/.test(f.code)) e.code = 'Use 3-32 characters: letters, digits, "-" or "_".';
  const v = num(f.value);
  if (!Number.isFinite(v) || v <= 0) e.value = 'Enter a value greater than 0.';
  else if (f.type === 'PERCENT' && v > 100) e.value = 'A percentage cannot be more than 100.';
  if (f.minSubtotal.trim() !== '') {
    const m = num(f.minSubtotal);
    if (!Number.isFinite(m) || m < 0) e.minSubtotal = 'Enter 0 or more.';
  }
  if (f.type === 'PERCENT' && f.maxDiscount.trim() !== '') {
    const m = num(f.maxDiscount);
    if (!Number.isFinite(m) || m <= 0) e.maxDiscount = 'Enter an amount greater than 0, or leave blank.';
  }
  if (f.maxUses.trim() !== '') {
    const u = num(f.maxUses);
    if (!Number.isInteger(u) || u < 1) e.maxUses = 'Enter a whole number of 1 or more, or leave blank.';
  }
  if (f.expiresOn !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(f.expiresOn)) e.expiresOn = 'Enter a valid date.';
  return e;
}

export function formToInput(f: CouponFormState): AdminCouponInput {
  return {
    code: f.code,
    type: f.type,
    value: Number(f.value),
    minSubtotal: f.minSubtotal.trim() === '' ? 0 : Number(f.minSubtotal),
    maxDiscount: f.type === 'PERCENT' && f.maxDiscount.trim() !== '' ? Number(f.maxDiscount) : null,
    expiresAt: dateInputToExpiry(f.expiresOn),
    maxUses: f.maxUses.trim() === '' ? null : Number(f.maxUses),
    active: f.active,
  };
}

export function describeCoupon(c: Pick<AdminCoupon, 'type' | 'value' | 'maxDiscount'>): string {
  if (c.type === 'FLAT') return `₹${c.value} off`;
  return `${c.value}% off${c.maxDiscount != null ? `, up to ₹${c.maxDiscount}` : ''}`;
}

export type CouponStatus = 'inactive' | 'expired' | 'used up' | 'active';
export function couponStatus(c: AdminCoupon, now: Date = new Date()): CouponStatus {
  if (!c.active) return 'inactive';
  if (c.expiresAt && new Date(c.expiresAt).getTime() <= now.getTime()) return 'expired';
  if (c.maxUses != null && c.usedCount >= c.maxUses) return 'used up';
  return 'active';
}
