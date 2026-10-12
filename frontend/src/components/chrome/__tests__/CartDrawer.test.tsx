import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
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
  });

  it('honours minOrderQty and stock in the stepper', async () => {
    setCart([item({ quantity: 3, minOrderQty: 3, stock: 10 })]);
    const { rerender } = render(<CartDrawer />);
    const dec = screen.getByRole('button', { name: 'Decrease quantity of Red Roses' });
    expect(dec).toHaveAttribute('aria-disabled', 'true');
    expect(dec).not.toBeDisabled(); // stays focusable
    await userEvent.click(dec);
    expect(cart.setQuantity).not.toHaveBeenCalled(); // no-op at the bound
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity of Red Roses' }));
    expect(cart.setQuantity).toHaveBeenCalledWith(1, 4);

    setCart([item({ quantity: 5, minOrderQty: 3, stock: 10 })]);
    rerender(<CartDrawer />);
    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity of Red Roses' }));
    expect(cart.setQuantity).toHaveBeenCalledWith(1, 4);

    setCart([item({ quantity: 10, minOrderQty: 3, stock: 10 })]);
    rerender(<CartDrawer />);
    const inc = screen.getByRole('button', { name: 'Increase quantity of Red Roses' });
    expect(inc).toHaveAttribute('aria-disabled', 'true');
    cart.setQuantity.mockClear();
    await userEvent.click(inc);
    expect(cart.setQuantity).not.toHaveBeenCalled();
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
});
