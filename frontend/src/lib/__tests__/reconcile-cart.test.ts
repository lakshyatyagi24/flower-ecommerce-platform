import { describe, it, expect } from 'vitest';
import {
  adjustmentNotices,
  blockingNotices,
  linesChanged,
  reconcileCart,
  type FreshProduct,
} from '../reconcile-cart';
import type { CartItem } from '../cart-context';

const line = (over: Partial<CartItem> = {}): CartItem => ({
  productId: 1,
  slug: 'rose',
  name: 'Rose',
  price: 100,
  image: null,
  quantity: 2,
  gstRate: 0,
  minOrderQty: 1,
  stock: 10,
  ...over,
});

const fresh = (over: Partial<FreshProduct> = {}): FreshProduct => ({
  id: 1,
  name: 'Rose',
  price: 100,
  stock: 10,
  active: true,
  saleMode: 'PURCHASE',
  gstRate: 0,
  minOrderQty: 1,
  ...over,
});

describe('reconcileCart: unchanged', () => {
  it('returns the very same line objects and no notices when nothing differs', () => {
    const lines = [line(), line({ productId: 2, slug: 'tulip', name: 'Tulip' })];
    const out = reconcileCart(lines, [fresh(), fresh({ id: 2, name: 'Tulip' })]);
    expect(out.notices).toEqual([]);
    expect(out.lines[0]).toBe(lines[0]);
    expect(out.lines[1]).toBe(lines[1]);
    expect(linesChanged(lines, out.lines)).toBe(false);
  });

  it('an empty bag stays empty', () => {
    expect(reconcileCart([], [fresh()])).toEqual({ lines: [], notices: [] });
  });

  it('a legacy line without stock/minOrderQty/gstRate is not reported as changed', () => {
    const legacy = line({ stock: undefined, minOrderQty: undefined, gstRate: undefined });
    const out = reconcileCart([legacy], [fresh({ stock: 10 })]);
    // Only the metadata is filled in; no notice for it.
    expect(out.notices).toEqual([]);
    expect(out.lines[0]).toMatchObject({ stock: 10, minOrderQty: 1, gstRate: 0, quantity: 2 });
  });

  it('does not mutate its inputs', () => {
    const lines = [line({ quantity: 20 })];
    const snapshot = JSON.stringify(lines);
    const products = [fresh({ stock: 5, price: 150 })];
    const productsSnapshot = JSON.stringify(products);
    reconcileCart(lines, products);
    expect(JSON.stringify(lines)).toBe(snapshot);
    expect(JSON.stringify(products)).toBe(productsSnapshot);
  });

  it('ignores float noise below a tenth of a paisa', () => {
    const out = reconcileCart([line({ price: 19.99 })], [fresh({ price: 19.99 + 1e-9 })]);
    expect(out.notices).toEqual([]);
  });
});

describe('reconcileCart: removed and unavailable products', () => {
  it('a product missing from the fresh list is flagged as removed, blocking, and the line is left in place', () => {
    const l = line();
    const out = reconcileCart([l], []);
    expect(out.lines[0]).toBe(l);
    expect(out.notices).toEqual([
      { productId: 1, name: 'Rose', kind: 'removed', blocking: true, message: 'No longer available.' },
    ]);
  });

  it('an inactive product is unavailable and blocking', () => {
    const out = reconcileCart([line()], [fresh({ active: false })]);
    expect(out.notices).toMatchObject([{ kind: 'unavailable', blocking: true, message: 'No longer available.' }]);
  });

  it('a product that became enquiry-only is unavailable and blocking', () => {
    const out = reconcileCart([line()], [fresh({ saleMode: 'ENQUIRY' })]);
    expect(out.notices).toMatchObject([{ kind: 'unavailable', blocking: true, message: 'Now available by enquiry only.' }]);
  });

  it('only the broken line is flagged; the healthy one is untouched', () => {
    const a = line();
    const b = line({ productId: 2, slug: 'tulip', name: 'Tulip' });
    const out = reconcileCart([a, b], [fresh({ id: 2, name: 'Tulip' })]);
    expect(out.notices.map((n) => n.productId)).toEqual([1]);
    expect(out.lines).toEqual([a, b]);
  });

  it('a blocking line keeps its old price even if the fresh price differs (nothing is rewritten for an unbuyable line)', () => {
    const l = line({ price: 100 });
    const out = reconcileCart([l], [fresh({ price: 999, active: false })]);
    expect(out.lines[0]).toBe(l);
    expect(out.notices).toHaveLength(1);
  });
});

describe('reconcileCart: stock', () => {
  it('zero stock is out of stock and blocking', () => {
    const l = line();
    const out = reconcileCart([l], [fresh({ stock: 0 })]);
    expect(out.lines[0]).toBe(l);
    expect(out.notices).toEqual([
      { productId: 1, name: 'Rose', kind: 'out-of-stock', blocking: true, message: 'Out of stock.' },
    ]);
  });

  it('negative stock is out of stock too', () => {
    expect(reconcileCart([line()], [fresh({ stock: -3 })]).notices[0]).toMatchObject({ kind: 'out-of-stock', blocking: true });
  });

  it('stock below the minimum order cannot be bought and says why', () => {
    const out = reconcileCart([line({ minOrderQty: 5, quantity: 5 })], [fresh({ stock: 3, minOrderQty: 5 })]);
    expect(out.notices).toEqual([
      {
        productId: 1,
        name: 'Rose',
        kind: 'out-of-stock',
        blocking: true,
        message: 'Only 3 left, below the minimum order of 5.',
      },
    ]);
  });

  it('a quantity above the remaining stock is clamped and reported (not blocking)', () => {
    const out = reconcileCart([line({ quantity: 9, stock: 10 })], [fresh({ stock: 4 })]);
    expect(out.lines[0]).toMatchObject({ quantity: 4, stock: 4 });
    expect(out.notices).toEqual([
      {
        productId: 1,
        name: 'Rose',
        kind: 'stock-reduced',
        blocking: false,
        message: 'Only 4 left. Quantity lowered from 9 to 4.',
      },
    ]);
  });

  it('a quantity exactly at stock is fine', () => {
    const out = reconcileCart([line({ quantity: 4 })], [fresh({ stock: 4 })]);
    expect(out.notices).toEqual([]);
    expect(out.lines[0]).toMatchObject({ quantity: 4, stock: 4 });
  });

  it('refreshes the remembered stock silently when it only went up', () => {
    const out = reconcileCart([line({ stock: 3, quantity: 2 })], [fresh({ stock: 50 })]);
    expect(out.notices).toEqual([]);
    expect(out.lines[0].stock).toBe(50);
  });

  it('a payload without a numeric stock never blocks or clamps', () => {
    const out = reconcileCart([line({ quantity: 7 })], [{ ...fresh(), stock: undefined as unknown as number }]);
    expect(out.notices).toEqual([]);
    expect(out.lines[0]).toMatchObject({ quantity: 7, stock: 10 });
  });
});

describe('reconcileCart: minimum order', () => {
  it('raises a quantity below a new minimum and says so', () => {
    const out = reconcileCart([line({ quantity: 2, minOrderQty: 1 })], [fresh({ minOrderQty: 5, stock: 20 })]);
    expect(out.lines[0]).toMatchObject({ quantity: 5, minOrderQty: 5 });
    expect(out.notices).toEqual([
      {
        productId: 1,
        name: 'Rose',
        kind: 'min-qty',
        blocking: false,
        message: 'Minimum order is 5. Quantity raised from 2 to 5.',
      },
    ]);
  });

  it('a quantity at the minimum is fine', () => {
    const out = reconcileCart([line({ quantity: 5, minOrderQty: 5 })], [fresh({ minOrderQty: 5 })]);
    expect(out.notices).toEqual([]);
  });

  it('treats a missing or zero minimum as 1', () => {
    expect(reconcileCart([line({ quantity: 1 })], [fresh({ minOrderQty: undefined })]).notices).toEqual([]);
    expect(reconcileCart([line({ quantity: 1 })], [fresh({ minOrderQty: 0 })]).notices).toEqual([]);
  });

  it('does not flag a quantity that is not a multiple of the minimum (the server only enforces the minimum)', () => {
    const out = reconcileCart([line({ quantity: 7, minOrderQty: 5 })], [fresh({ minOrderQty: 5, stock: 20 })]);
    expect(out.notices).toEqual([]);
    expect(out.lines[0].quantity).toBe(7);
  });
});

describe('reconcileCart: price', () => {
  it('updates the price and reports old and new', () => {
    const out = reconcileCart([line({ price: 100 })], [fresh({ price: 120 })]);
    expect(out.lines[0].price).toBe(120);
    expect(out.notices).toEqual([
      { productId: 1, name: 'Rose', kind: 'price-changed', blocking: false, message: 'Price changed from ₹100 to ₹120 each.' },
    ]);
  });

  it('a price drop is reported the same way', () => {
    const out = reconcileCart([line({ price: 100 })], [fresh({ price: 80 })]);
    expect(out.notices[0].message).toBe('Price changed from ₹100 to ₹80 each.');
  });

  it('a tax-rate change alone updates the line and is reported', () => {
    const out = reconcileCart([line({ gstRate: 5 })], [fresh({ gstRate: 18 })]);
    expect(out.lines[0].gstRate).toBe(18);
    expect(out.notices).toMatchObject([{ kind: 'price-changed', blocking: false, message: 'Tax rate changed. The total has been updated.' }]);
  });

  it('a price change and a tax change give one notice', () => {
    const out = reconcileCart([line({ price: 100, gstRate: 5 })], [fresh({ price: 110, gstRate: 18 })]);
    expect(out.notices).toHaveLength(1);
    expect(out.lines[0]).toMatchObject({ price: 110, gstRate: 18 });
  });

  it('a renamed product updates the name without a notice', () => {
    const out = reconcileCart([line()], [fresh({ name: 'Rose (red)' })]);
    expect(out.lines[0].name).toBe('Rose (red)');
    expect(out.notices).toEqual([]);
  });
});

describe('reconcileCart: combinations and unverified lines', () => {
  it('stock and price problems on one line give two notices in a stable order and one updated line', () => {
    const out = reconcileCart([line({ quantity: 8, price: 100 })], [fresh({ stock: 3, price: 130 })]);
    expect(out.notices.map((n) => n.kind)).toEqual(['stock-reduced', 'price-changed']);
    expect(out.lines[0]).toMatchObject({ quantity: 3, price: 130, stock: 3 });
  });

  it('lines the caller could not verify pass through untouched, with no notice and no "removed"', () => {
    const l = line({ price: 100, quantity: 3 });
    const out = reconcileCart([l], [], { unverified: [1] });
    expect(out.lines[0]).toBe(l);
    expect(out.notices).toEqual([]);
  });

  it('unverified accepts any iterable and only affects the listed ids', () => {
    const a = line();
    const b = line({ productId: 2, slug: 'tulip', name: 'Tulip' });
    const out = reconcileCart([a, b], [], { unverified: new Set([2]) });
    expect(out.notices.map((n) => n.productId)).toEqual([1]);
    expect(out.lines[1]).toBe(b);
  });

  it('keeps the bag order and handles duplicate fresh entries (last wins)', () => {
    const a = line();
    const b = line({ productId: 2, slug: 'tulip', name: 'Tulip' });
    const out = reconcileCart([b, a], [fresh({ price: 1 }), fresh({ price: 100 }), fresh({ id: 2, name: 'Tulip' })]);
    expect(out.lines.map((l) => l.productId)).toEqual([2, 1]);
    expect(out.notices).toEqual([]);
  });

  it('is idempotent: reconciling the result again produces no new adjustment notices', () => {
    const first = reconcileCart([line({ quantity: 9, price: 100, minOrderQty: 1 })], [fresh({ stock: 4, price: 140, minOrderQty: 2 })]);
    const second = reconcileCart(first.lines, [fresh({ stock: 4, price: 140, minOrderQty: 2 })]);
    expect(second.notices).toEqual([]);
    expect(linesChanged(first.lines, second.lines)).toBe(false);
  });

  it('blocking and adjustment helpers split the notices', () => {
    const out = reconcileCart(
      [line(), line({ productId: 2, slug: 'b', name: 'B', price: 10 })],
      [fresh({ stock: 0 }), fresh({ id: 2, name: 'B', price: 12 })],
    );
    expect(blockingNotices(out.notices).map((n) => n.productId)).toEqual([1]);
    expect(adjustmentNotices(out.notices).map((n) => n.productId)).toEqual([2]);
  });

  it('linesChanged notices length and element differences', () => {
    const a = line();
    expect(linesChanged([a], [a])).toBe(false);
    expect(linesChanged([a], [{ ...a }])).toBe(true);
    expect(linesChanged([a], [])).toBe(true);
  });
});
