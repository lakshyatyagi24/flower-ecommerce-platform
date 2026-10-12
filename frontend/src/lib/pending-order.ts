// Remembers an online order that is awaiting payment so a page refresh cannot
// lead to a second order. Only the id is used (to re-fetch the order from the
// API); nothing in sessionStorage is trusted for money or state.

export const PENDING_ORDER_KEY = 'fp_pending_order';
export const PENDING_ORDER_TTL_MS = 30 * 60 * 1000;

export function savePendingOrder(id: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({ id, createdAt: Date.now() }));
  } catch {}
}

export function clearPendingOrder(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(PENDING_ORDER_KEY);
  } catch {}
}

/** Returns the pending order id if a fresh, well-formed record exists; otherwise clears and returns null. */
export function readPendingOrderId(): number | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(PENDING_ORDER_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;
  try {
    const v = JSON.parse(raw) as { id?: unknown; createdAt?: unknown };
    if (
      v &&
      typeof v.id === 'number' &&
      Number.isInteger(v.id) &&
      v.id > 0 &&
      typeof v.createdAt === 'number' &&
      Number.isFinite(v.createdAt) &&
      Date.now() - v.createdAt >= 0 &&
      Date.now() - v.createdAt < PENDING_ORDER_TTL_MS
    ) {
      return v.id;
    }
  } catch {}
  clearPendingOrder();
  return null;
}

/**
 * Clears the stored pending-order key, but only when it refers to this order,
 * so resolving one order never forgets a different pending one.
 */
export function resolveOrderLocally(orderId: number): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.sessionStorage.getItem(PENDING_ORDER_KEY);
    if (raw === null) return;
    let id: unknown;
    try {
      id = (JSON.parse(raw) as { id?: unknown } | null)?.id;
    } catch {
      id = undefined;
    }
    if (id === orderId) window.sessionStorage.removeItem(PENDING_ORDER_KEY);
  } catch {}
}
