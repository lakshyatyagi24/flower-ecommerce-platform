import type { ApiProduct } from './api';
import type { CartItem } from './cart-context';
import { formatINR } from './format';
import { minQty } from './product-helpers';

/** The fields of a freshly fetched product that reconciliation looks at. */
export type FreshProduct = Pick<ApiProduct, 'id' | 'name' | 'price' | 'stock' | 'active' | 'saleMode' | 'gstRate' | 'minOrderQty'>;

export type CartNoticeKind =
  | 'removed' // the product no longer exists
  | 'unavailable' // inactive, or now enquiry-only
  | 'out-of-stock' // nothing left, or fewer left than the minimum order
  | 'stock-reduced' // fewer left than the quantity in the bag: quantity was lowered
  | 'min-qty' // the minimum order went up past the quantity in the bag: quantity was raised
  | 'price-changed'; // price (or tax rate) differs from what the bag remembered: line was updated

export type CartNotice = {
  productId: number;
  name: string;
  kind: CartNoticeKind;
  /** True when the line cannot be bought as it is: it must be removed before checking out. */
  blocking: boolean;
  /** One short sentence, without the product name (callers show it next to the line). */
  message: string;
};

export type ReconcileOptions = {
  /** Product ids whose fresh data could not be fetched (network error). Those lines pass through untouched. */
  unverified?: Iterable<number>;
};

const EPS = 0.001;

function sameNumber(a: number | undefined, b: number | undefined): boolean {
  return Math.abs((a ?? 0) - (b ?? 0)) <= EPS;
}

/**
 * Compares the bag with current product data. Pure.
 *
 * - A product missing from `freshProducts` (and not in `unverified`) no longer exists.
 * - Blocking problems (removed, unavailable, out of stock) leave the line exactly as it was, so the shopper can
 *   see what is wrong and remove it; nothing is deleted on their behalf.
 * - Fixable differences update the line: quantity clamped into [minimum order, stock], price/tax/stock/minimum
 *   copied from the product. Each one produces a notice so nothing changes silently.
 * - Lines that already match come back as the SAME object (reference equality), so callers can cheaply detect change.
 *
 * The server stays authoritative for the amount charged; this only keeps what the shopper sees honest.
 */
export function reconcileCart(
  lines: readonly CartItem[],
  freshProducts: readonly FreshProduct[],
  options: ReconcileOptions = {},
): { lines: CartItem[]; notices: CartNotice[] } {
  const fresh = new Map<number, FreshProduct>();
  for (const p of freshProducts) fresh.set(p.id, p);
  const unverified = new Set(options.unverified ?? []);
  const notices: CartNotice[] = [];

  const out = lines.map((line): CartItem => {
    if (unverified.has(line.productId)) return line;
    const note = (kind: CartNoticeKind, blocking: boolean, message: string) =>
      notices.push({ productId: line.productId, name: line.name, kind, blocking, message });

    const p = fresh.get(line.productId);
    if (!p) {
      note('removed', true, 'No longer available.');
      return line;
    }
    if (p.active === false) {
      note('unavailable', true, 'No longer available.');
      return line;
    }
    if (p.saleMode === 'ENQUIRY') {
      note('unavailable', true, 'Now available by enquiry only.');
      return line;
    }

    // A payload without a usable price is not data we can act on: leave the line as it is, write no NaN.
    if (typeof p.price !== 'number' || !Number.isFinite(p.price)) return line;

    const min = minQty(p);
    // A payload without a numeric stock says nothing about availability: do not guess.
    const stock = typeof p.stock === 'number' && Number.isFinite(p.stock) ? p.stock : null;
    if (stock !== null && stock <= 0) {
      note('out-of-stock', true, 'Out of stock.');
      return line;
    }
    if (stock !== null && stock < min) {
      note('out-of-stock', true, `Only ${stock} left, below the minimum order of ${min}.`);
      return line;
    }

    let quantity = line.quantity;
    if (stock !== null && quantity > stock) {
      quantity = stock;
      note('stock-reduced', false, `Only ${stock} left. Quantity lowered from ${line.quantity} to ${quantity}.`);
    }
    if (quantity < min) {
      quantity = min;
      note('min-qty', false, `Minimum order is ${min}. Quantity raised from ${line.quantity} to ${quantity}.`);
    }

    const gstRate = p.gstRate ?? 0;
    if (!sameNumber(p.price, line.price)) {
      note('price-changed', false, `Price changed from ${formatINR(line.price)} to ${formatINR(p.price)} each.`);
    } else if (!sameNumber(gstRate, line.gstRate)) {
      note('price-changed', false, 'Tax rate changed. The total has been updated.');
    }

    const next: CartItem = {
      ...line,
      name: p.name || line.name,
      price: p.price,
      gstRate,
      stock: stock ?? line.stock,
      minOrderQty: min,
      quantity,
    };
    const same =
      next.name === line.name &&
      sameNumber(next.price, line.price) &&
      sameNumber(next.gstRate, line.gstRate) &&
      next.stock === line.stock &&
      next.minOrderQty === (line.minOrderQty ?? 1) &&
      next.quantity === line.quantity;
    return same ? line : next;
  });

  return { lines: out, notices };
}

/**
 * Applies a reconcile result to the bag as it is NOW. A line is replaced only if it is still the very object the
 * reconcile started from; a line the shopper changed meanwhile (quantity click, removal, new line) is kept as is,
 * so a slow lookup can never overwrite a click.
 */
export function applyReconciled(current: readonly CartItem[], before: readonly CartItem[], after: readonly CartItem[]): CartItem[] {
  const next = new Map<CartItem, CartItem>();
  before.forEach((b, i) => next.set(b, after[i]));
  return current.map((c) => next.get(c) ?? c);
}

/** True when at least one line object differs (by reference) from the input. */
export function linesChanged(before: readonly CartItem[], after: readonly CartItem[]): boolean {
  return before.length !== after.length || before.some((l, i) => l !== after[i]);
}

/** Notices that stop the order: the shopper must remove those lines. */
export const blockingNotices = (notices: readonly CartNotice[]) => notices.filter((n) => n.blocking);
/** Notices describing something that was adjusted: the shopper must see (and accept) them before paying. */
export const adjustmentNotices = (notices: readonly CartNotice[]) => notices.filter((n) => !n.blocking);
