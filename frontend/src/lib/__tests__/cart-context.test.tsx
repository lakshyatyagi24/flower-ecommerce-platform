import React from 'react';
import { act, render } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { CartProvider, useCart, type CartItem } from '../cart-context';
import { applyReconciled } from '../reconcile-cart';

let cart: ReturnType<typeof useCart>;
function Probe() {
  cart = useCart();
  return null;
}
const mount = () => render(<CartProvider><Probe /></CartProvider>);
const base = { productId: 1, slug: 'rose', name: 'Rose', price: 100, image: null, stock: 6, minOrderQty: 1 };

beforeEach(() => window.localStorage.clear());

describe('cart quantity limits', () => {
  it('add clamps the running sum to stock', () => {
    mount();
    act(() => cart.add(base, 4));
    act(() => cart.add(base, 4));
    expect(cart.items[0].quantity).toBe(6);
  });
  it('a first add above stock is clamped to stock; below the minimum is raised to it', () => {
    mount();
    act(() => cart.add(base, 50));
    expect(cart.items[0].quantity).toBe(6);
    act(() => cart.add({ ...base, productId: 2, slug: 'b', minOrderQty: 4 }, 1));
    expect(cart.items[1].quantity).toBe(4);
  });
  it('setQuantity clamps into [minimum, stock]', () => {
    mount();
    act(() => cart.add({ ...base, minOrderQty: 3 }, 3));
    act(() => cart.setQuantity(1, 99));
    expect(cart.items[0].quantity).toBe(6);
    act(() => cart.setQuantity(1, 1));
    expect(cart.items[0].quantity).toBe(3);
  });
});

describe('replaceWith', () => {
  it('applies a reconcile result without overwriting a click that landed meanwhile', () => {
    mount();
    act(() => cart.add({ ...base, stock: 20 }, 2));
    const snapshot: CartItem[] = cart.items;
    const reconciled = snapshot.map((l) => ({ ...l, price: 120 }));
    act(() => {
      cart.setQuantity(1, 5); // the shopper's click, before the lookup result is applied
      cart.replaceWith((prev) => applyReconciled(prev, snapshot, reconciled));
    });
    expect(cart.items[0].quantity).toBe(5);
    expect(cart.items[0].price).toBe(100); // the edited line is left for the next reconcile, not clobbered
  });
  it('applies the result when nothing changed meanwhile', () => {
    mount();
    act(() => cart.add({ ...base, stock: 20 }, 2));
    const snapshot: CartItem[] = cart.items;
    act(() => cart.replaceWith((prev) => applyReconciled(prev, snapshot, snapshot.map((l) => ({ ...l, price: 120 })))));
    expect(cart.items[0]).toMatchObject({ quantity: 2, price: 120 });
  });
});
