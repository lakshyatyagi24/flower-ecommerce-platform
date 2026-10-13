/**
 * Mirrors the backend (orders.service.ts loadFreeShippingThreshold + create): the free-shipping threshold is
 * parseFloat(value); blank / non-numeric means "no free shipping"; any finite number (including 0) means an order
 * whose subtotal is >= threshold ships free. So "0" makes every order free, exactly as the server charges it.
 */
export function parseFreeThreshold(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const v = parseFloat(raw);
  return Number.isNaN(v) ? null : v;
}

export function parseFlatRate(raw: string | null | undefined): number {
  const v = parseFloat(raw ?? '');
  return Number.isNaN(v) ? 0 : v;
}

export function shippingFor(subtotal: number, flatRate: number, freeThreshold: number | null): number {
  return freeThreshold !== null && subtotal >= freeThreshold ? 0 : flatRate;
}
