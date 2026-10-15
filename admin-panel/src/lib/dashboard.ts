// Pure helpers for the dashboard charts (no React, no network).
import type { AdminStatsSeriesPoint } from './api';

export const RANGE_OPTIONS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];
export const DEFAULT_RANGE: RangeDays = 30;

const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

/** Today's calendar date in India (UTC+05:30, no DST), `YYYY-MM-DD`. */
export function istToday(now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The last `days` India days ending today, inclusive: the server buckets orders by IST day too. */
export function rangeForDays(days: number, now: Date = new Date()): { from: string; to: string } {
  const to = istToday(now);
  const from = new Date(Date.parse(`${to}T00:00:00Z`) - (days - 1) * DAY_MS).toISOString().slice(0, 10);
  return { from, to };
}

export function formatINR(amount: number): string {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `₹${amount.toFixed(0)}`;
  }
}

/** Compact rupee tick for the revenue axis: 950 -> ₹950, 12500 -> ₹12.5k, 2400000 -> ₹24L. */
export function formatINRCompact(amount: number): string {
  if (amount >= 10_000_000) return `₹${trim(amount / 10_000_000)}Cr`;
  if (amount >= 100_000) return `₹${trim(amount / 100_000)}L`;
  if (amount >= 1_000) return `₹${trim(amount / 1_000)}k`;
  return `₹${Math.round(amount)}`;
}

function trim(n: number): string {
  return String(Math.round(n * 10) / 10);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2026-10-05` -> `5 Oct` (parsed by hand: no timezone surprises). */
export function formatDay(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[m - 1] ?? ''}`.trim();
}

export interface SeriesSummary {
  totalOrders: number;
  totalRevenue: number;
  /** True when no order was placed in the whole period. */
  empty: boolean;
  peakOrders: { date: string; value: number } | null;
  peakRevenue: { date: string; value: number } | null;
}

export function summarizeSeries(series: AdminStatsSeriesPoint[]): SeriesSummary {
  let totalOrders = 0;
  let totalRevenue = 0;
  let peakOrders: SeriesSummary['peakOrders'] = null;
  let peakRevenue: SeriesSummary['peakRevenue'] = null;
  for (const p of series) {
    totalOrders += p.orders;
    totalRevenue += p.revenue;
    if (p.orders > 0 && (!peakOrders || p.orders > peakOrders.value)) peakOrders = { date: p.date, value: p.orders };
    if (p.revenue > 0 && (!peakRevenue || p.revenue > peakRevenue.value)) peakRevenue = { date: p.date, value: p.revenue };
  }
  return { totalOrders, totalRevenue: Math.round(totalRevenue * 100) / 100, empty: totalOrders === 0, peakOrders, peakRevenue };
}

/** One plain-language sentence per chart for screen readers (the SVG itself is hidden from them). */
export function describeSeries(kind: 'orders' | 'revenue', days: number, series: AdminStatsSeriesPoint[]): string {
  const s = summarizeSeries(series);
  if (s.empty) return `No orders in the last ${days} days.`;
  if (kind === 'orders') {
    return `Orders per day, last ${days} days: ${s.totalOrders} in total, most on ${formatDay(s.peakOrders!.date)} (${s.peakOrders!.value}).`;
  }
  const peak = s.peakRevenue ? `, highest on ${formatDay(s.peakRevenue.date)} (${formatINR(s.peakRevenue.value)})` : '';
  return `Revenue per day, last ${days} days: ${formatINR(s.totalRevenue)} in total${peak}.`;
}
