/**
 * Delivery-date helpers for the storefront. All dates are plain `YYYY-MM-DD` calendar dates in India time,
 * exactly as `GET /delivery/options` returns them; nothing here depends on the browser timezone. Order
 * responses carry the stored value (UTC midnight of that date), so only the first 10 characters matter.
 */
export type DeliveryOptions = { earliest: string; latest: string; blackoutDates: string[] };

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November',
  'December',
];

export function isIsoDate(s: unknown): s is string {
  if (typeof s !== 'string') return false;
  const m = ISO_DATE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** 'Wednesday, 14 October 2026' from `YYYY-MM-DD` or an ISO timestamp; '' when unusable. */
export function formatDeliveryDate(value: string | null | undefined): string {
  const iso = typeof value === 'string' ? value.slice(0, 10) : '';
  if (!isIsoDate(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${WEEKDAYS[day]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

/** Only well-formed options are trusted; anything else is treated as a failed load. */
export function isDeliveryOptions(o: unknown): o is DeliveryOptions {
  const x = o as DeliveryOptions | null;
  return (
    !!x &&
    isIsoDate(x.earliest) &&
    isIsoDate(x.latest) &&
    x.earliest <= x.latest &&
    Array.isArray(x.blackoutDates) &&
    x.blackoutDates.every(isIsoDate)
  );
}

/** Inline error for the chosen date, or undefined when it is acceptable. Mirrors the backend rules. */
export function validateDeliveryDate(value: string, opts: DeliveryOptions): string | undefined {
  if (!value) return 'Choose a delivery date';
  if (!isIsoDate(value)) return 'Enter a valid delivery date';
  if (value < opts.earliest || value > opts.latest) {
    return `Choose a date between ${formatDeliveryDate(opts.earliest)} and ${formatDeliveryDate(opts.latest)}`;
  }
  if (opts.blackoutDates.includes(value)) {
    return `We can't deliver on ${formatDeliveryDate(value)}. Please choose another day.`;
  }
  return undefined;
}
