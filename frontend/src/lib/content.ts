/**
 * Dates shown on legal pages. Constants (never `new Date()`): the page must say when the wording was last
 * changed, not when it was last rendered. Bump the matching entry whenever the copy is edited.
 */
export const LEGAL_UPDATED = {
  privacy: '2026-10-13',
  terms: '2026-10-13',
  refund: '2026-10-13',
} as const;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** '2026-10-13' -> '13 October 2026'. Locale independent so server and client render the same text. */
export function formatLongDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${Number(m[3])} ${month} ${m[1]}` : iso;
}
