import React from 'react';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/cart-context', async () => {
  const h = await import('./helpers');
  const { formatINR } = await import('@/lib/format');
  return { useCart: () => h.cart, formatINR };
});
vi.mock('@/lib/settings-context', async (orig) => {
  const real = await orig<typeof import('@/lib/settings-context')>();
  const h = await import('./helpers');
  return { ...real, useSettings: () => ({ ...real.useSettings(), raw: h.settingsRaw }) };
});

const fetchFresh = vi.hoisted(() => vi.fn());
vi.mock('@/lib/fresh-products', () => ({ fetchFreshProducts: fetchFresh }));

import CartDrawer from '../../CartDrawer';
import { cart, resetChromeMocks, settingsRaw } from './helpers';

const item = (over: Record<string, unknown> = {}) => ({
  productId: 1,
  slug: 'red-roses',
  name: 'Red Roses',
  price: 500,
  image: null,
  quantity: 3,
  minOrderQty: 3,
  stock: 10,
  ...over,
});

function setCart(items: ReturnType<typeof item>[]) {
  cart.items = items;
  cart.count = items.reduce((n, i) => n + i.quantity, 0);
  cart.subtotal = items.reduce((n, i) => n + i.quantity * i.price, 0);
  cart.isOpen = true;
}

beforeEach(() => {
  resetChromeMocks();
  document.body.style.overflow = '';
  // Default: the lookup could not verify anything, so the bag is left exactly as it is.
  fetchFresh.mockReset().mockImplementation(async (lines: { productId: number }[]) => ({
    fresh: [],
    unverified: lines.map((l) => l.productId),
    failed: true,
  }));
});

describe('CartDrawer', () => {
  it('renders nothing while closed', () => {
    render(<CartDrawer />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the empty state with a link to the catalogue', () => {
    cart.isOpen = true;
    render(<CartDrawer />);
    const dialog = screen.getByRole('dialog', { name: /Your bag/ });
    expect(within(dialog).getByText('Your bag is empty')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Browse flowers/i })).toHaveAttribute('href', '/products');
    expect(within(dialog).queryByRole('link', { name: 'Checkout' })).toBeNull();
  });

  it('lists line items with a link to the product, unit price and a count in the header', () => {
    setCart([item()]);
    render(<CartDrawer />);
    expect(screen.getByRole('heading', { name: 'Your bag (3)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Red Roses' })).toHaveAttribute('href', '/products/red-roses');
    expect(screen.getByText(/₹500 each/)).toBeInTheDocument();
    expect(screen.getByText(/minimum order: 3/i)).toBeInTheDocument();
  });

  it('steps by the minimum order, never below it, and the last step up lands on stock', async () => {
    const dec = () => screen.getByRole('button', { name: 'Decrease quantity of Red Roses' });
    const inc = () => screen.getByRole('button', { name: 'Increase quantity of Red Roses' });

    setCart([item({ quantity: 3, minOrderQty: 3, stock: 10 })]);
    const { rerender } = render(<CartDrawer />);
    expect(dec()).toHaveAttribute('aria-disabled', 'true');
    expect(dec()).not.toBeDisabled(); // stays focusable
    await userEvent.click(dec());
    expect(cart.setQuantity).not.toHaveBeenCalled(); // no-op at the bound
    await userEvent.click(inc());
    expect(cart.setQuantity).toHaveBeenLastCalledWith(1, 6);

    // The original case: 5 in the bag with a minimum of 3 can go down (to the minimum) and up.
    setCart([item({ quantity: 5, minOrderQty: 3, stock: 10 })]);
    rerender(<CartDrawer />);
    expect(dec()).not.toHaveAttribute('aria-disabled');
    await userEvent.click(dec());
    expect(cart.setQuantity).toHaveBeenLastCalledWith(1, 3);
    await userEvent.click(inc());
    expect(cart.setQuantity).toHaveBeenLastCalledWith(1, 8);

    setCart([item({ quantity: 9, minOrderQty: 3, stock: 10 })]);
    rerender(<CartDrawer />);
    await userEvent.click(inc());
    expect(cart.setQuantity).toHaveBeenLastCalledWith(1, 10); // lands on stock, not 12
    await userEvent.click(dec());
    expect(cart.setQuantity).toHaveBeenLastCalledWith(1, 6);

    setCart([item({ quantity: 10, minOrderQty: 3, stock: 10 })]);
    rerender(<CartDrawer />);
    expect(inc()).toHaveAttribute('aria-disabled', 'true');
    cart.setQuantity.mockClear();
    await userEvent.click(inc());
    expect(cart.setQuantity).not.toHaveBeenCalled();
    expect(dec()).not.toHaveAttribute('aria-disabled');
  });

  it('min 4 with 6 in stock: both buttons work and neither is ever stuck', async () => {
    const dec = () => screen.getByRole('button', { name: 'Decrease quantity of Red Roses' });
    const inc = () => screen.getByRole('button', { name: 'Increase quantity of Red Roses' });
    setCart([item({ quantity: 4, minOrderQty: 4, stock: 6 })]);
    const { rerender } = render(<CartDrawer />);
    expect(inc()).not.toHaveAttribute('aria-disabled');
    await userEvent.click(inc());
    expect(cart.setQuantity).toHaveBeenLastCalledWith(1, 6);
    setCart([item({ quantity: 6, minOrderQty: 4, stock: 6 })]);
    rerender(<CartDrawer />);
    expect(inc()).toHaveAttribute('aria-disabled', 'true');
    expect(dec()).not.toHaveAttribute('aria-disabled');
    await userEvent.click(dec());
    expect(cart.setQuantity).toHaveBeenLastCalledWith(1, 4);
  });

  it('keeps focus on a stepper button that reaches its bound', async () => {
    setCart([item({ quantity: 9, minOrderQty: 1, stock: 10 })]);
    render(<CartDrawer />);
    const inc = screen.getByRole('button', { name: 'Increase quantity of Red Roses' });
    inc.focus();
    await userEvent.click(inc);
    expect(inc).toHaveFocus();
  });

  it('announces quantity changes politely', () => {
    setCart([item()]);
    render(<CartDrawer />);
    const qty = screen.getByText('3', { selector: '[aria-live]' });
    expect(qty).toHaveAttribute('aria-live', 'polite');
  });

  it('removes a line', async () => {
    setCart([item()]);
    render(<CartDrawer />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Red Roses' }));
    expect(cart.remove).toHaveBeenCalledWith(1);
  });

  it('shows the subtotal, GST when present, and the checkout and continue-shopping links', async () => {
    setCart([item({ quantity: 4, price: 250 })]);
    cart.gstTotal = 50;
    render(<CartDrawer />);
    const footer = screen.getByTestId('cart-footer');
    expect(within(footer).getByText('Subtotal').nextSibling).toHaveTextContent('₹1,000');
    expect(within(footer).getByText('GST').nextSibling).toHaveTextContent('₹50');
    const checkout = within(footer).getByRole('link', { name: 'Checkout' });
    expect(checkout).toHaveAttribute('href', '/checkout');
    expect(within(footer).getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/products');
    await userEvent.click(checkout);
    expect(cart.close).toHaveBeenCalled();
  });

  it('shows no free-shipping line unless the setting exists', () => {
    setCart([item()]);
    render(<CartDrawer />);
    expect(screen.queryByText(/free shipping/i)).toBeNull();
  });

  it('shows settings-driven progress towards free shipping, then the qualified message', () => {
    settingsRaw['shipping.freeThreshold'] = '2000';
    setCart([item({ quantity: 3, price: 500 })]);
    const { rerender } = render(<CartDrawer />);
    expect(screen.getByText(/Add ₹500 more for free shipping/)).toBeInTheDocument();
    setCart([item({ quantity: 4, price: 500 })]);
    rerender(<CartDrawer />);
    expect(screen.getByText(/qualifies for free shipping/i)).toBeInTheDocument();
  });

  it('closes on Escape and on overlay click, and locks scroll while open', () => {
    setCart([item()]);
    const { unmount } = render(<CartDrawer />);
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(cart.close).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('cart-overlay'));
    expect(cart.close).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('cart-overlay')).toHaveAttribute('aria-hidden', 'true');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('returns focus to the element that opened it', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    setCart([item()]);
    const { rerender } = render(<CartDrawer />);
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    cart.isOpen = false;
    rerender(<CartDrawer />);
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('after removing a middle line, focus moves to the next Remove button', async () => {
    setCart([item({ productId: 1, name: 'A' }), item({ productId: 2, name: 'B' }), item({ productId: 3, name: 'C' })]);
    render(<CartDrawer />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove B' }));
    expect(cart.remove).toHaveBeenCalledWith(2);
    expect(screen.getByRole('button', { name: 'Remove C' })).toHaveFocus();
  });

  it('after removing the last line, focus moves to the previous line, then to Close when none remain', async () => {
    setCart([item({ productId: 1, name: 'A' }), item({ productId: 2, name: 'B' })]);
    const { rerender } = render(<CartDrawer />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove B' }));
    expect(screen.getByRole('button', { name: 'Remove A' })).toHaveFocus();
    setCart([item({ productId: 1, name: 'A' })]);
    rerender(<CartDrawer />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove A' }));
    expect(screen.getByRole('button', { name: 'Close bag' })).toHaveFocus();
  });

  it('draws the free-shipping progress as a moss fill on a stone-light track', () => {
    settingsRaw['shipping.freeThreshold'] = '2000';
    setCart([item({ quantity: 3, price: 500 })]);
    render(<CartDrawer />);
    const fill = screen.getByTestId('shipping-progress-fill');
    expect(fill.className).toContain('bg-moss');
    expect(fill.parentElement!.className).toContain('bg-stone-light');
    expect(fill.parentElement!.className).toContain('h-1');
  });

  describe('revalidation on open', () => {
    const fresh = (over: Record<string, unknown> = {}) => ({
      id: 1, name: 'Red Roses', slug: 'red-roses', price: 500, stock: 10, active: true, saleMode: 'PURCHASE',
      gstRate: 0, minOrderQty: 3, ...over,
    });
    const answer = (products: ReturnType<typeof fresh>[]) =>
      fetchFresh.mockResolvedValue({ fresh: products, unverified: [], failed: false });

    // The drawer applies reconcile results through a functional update; run it against the bag as it is.
    const applied = () => cart.replaceWith.mock.calls[0][0](cart.items);

    it('a slow lookup never overwrites a quantity the shopper changed meanwhile', async () => {
      const original = item({ price: 500, quantity: 3 });
      setCart([original]);
      let resolve!: (v: unknown) => void;
      fetchFresh.mockReturnValue(new Promise((r) => (resolve = r)));
      render(<CartDrawer />);
      resolve({ fresh: [fresh({ price: 550 })], unverified: [], failed: false });
      await waitFor(() => expect(cart.replaceWith).toHaveBeenCalled());
      const edited = { ...original, quantity: 6 }; // the click landed before the update ran
      const out = cart.replaceWith.mock.calls[0][0]([edited]);
      expect(out[0]).toBe(edited);
    });

    it('changing a quantity clears that line adjustment notice but keeps blocking ones', async () => {
      setCart([item({ quantity: 9, stock: 10 })]);
      answer([fresh({ stock: 6 })]);
      render(<CartDrawer />);
      expect(await screen.findByText('Only 6 left. Quantity lowered from 9 to 6.')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity of Red Roses' }));
      expect(screen.queryByText(/quantity lowered/i)).toBeNull();
      expect(screen.getByTestId('cart-notices-live')).toHaveTextContent('');
    });

    it('asks once for the lines in the bag when it opens', async () => {
      setCart([item(), item({ productId: 2, slug: 'tulips', name: 'Tulips' })]);
      render(<CartDrawer />);
      await waitFor(() => expect(fetchFresh).toHaveBeenCalledTimes(1));
      expect(fetchFresh.mock.calls[0][0].map((l: { slug: string }) => l.slug)).toEqual(['red-roses', 'tulips']);
    });

    it('flags an out-of-stock line with a one-line notice, keeps the line and points at Remove', async () => {
      setCart([item()]);
      answer([fresh({ stock: 0 })]);
      render(<CartDrawer />);
      expect(await screen.findByText('Out of stock. Remove it to check out.')).toBeInTheDocument();
      expect(cart.replaceWith).not.toHaveBeenCalled(); // nothing is deleted or rewritten for the shopper
      const remove = screen.getByRole('button', { name: 'Remove Red Roses' });
      expect(remove).toHaveAccessibleDescription(/out of stock/i);
      expect(screen.getByText(/can.t be ordered right now/i)).toBeInTheDocument();
    });

    it('announces notices politely through a region that was already on screen', async () => {
      setCart([item()]);
      answer([fresh({ stock: 0 })]);
      render(<CartDrawer />);
      const live = screen.getByTestId('cart-notices-live');
      expect(live).toHaveAttribute('role', 'status');
      expect(live).toHaveAttribute('aria-live', 'polite');
      expect(live).toHaveTextContent('');
      await waitFor(() => expect(live).toHaveTextContent('Red Roses: Out of stock.'));
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('updates a changed price in the bag and says so', async () => {
      setCart([item({ price: 500 })]);
      answer([fresh({ price: 550 })]);
      render(<CartDrawer />);
      expect(await screen.findByText('Price changed from ₹500 to ₹550 each.')).toBeInTheDocument();
      expect(cart.replaceWith).toHaveBeenCalledTimes(1);
      expect(applied()[0]).toMatchObject({ productId: 1, price: 550 });
      expect(screen.queryByText(/remove it to check out/i)).toBeNull(); // not blocking
    });

    it('lowers a quantity above the remaining stock and says so', async () => {
      setCart([item({ quantity: 9, stock: 10 })]);
      answer([fresh({ stock: 6 })]);
      render(<CartDrawer />);
      expect(await screen.findByText('Only 6 left. Quantity lowered from 9 to 6.')).toBeInTheDocument();
      expect(applied()[0]).toMatchObject({ quantity: 6, stock: 6 });
    });

    it('tolerates a failed lookup: no notices, bag untouched, nothing blocked', async () => {
      setCart([item()]);
      fetchFresh.mockRejectedValue(new Error('network'));
      render(<CartDrawer />);
      await waitFor(() => expect(fetchFresh).toHaveBeenCalled());
      expect(cart.replaceWith).not.toHaveBeenCalled();
      expect(screen.queryByTestId('line-notice')).toBeNull();
      expect(screen.getByRole('link', { name: 'Checkout' })).toBeInTheDocument();
    });

    it('does not touch a line that was added while the lookup was in flight', async () => {
      setCart([item()]);
      let resolve!: (v: unknown) => void;
      fetchFresh.mockReturnValue(new Promise((r) => (resolve = r)));
      const { rerender } = render(<CartDrawer />);
      setCart([item(), item({ productId: 2, slug: 'tulips', name: 'Tulips' })]);
      rerender(<CartDrawer />);
      resolve({ fresh: [fresh()], unverified: [], failed: false });
      await waitFor(() => expect(fetchFresh).toHaveBeenCalled());
      await new Promise((r) => setTimeout(r, 0));
      expect(screen.queryByText('No longer available.')).toBeNull();
    });
  });
});
