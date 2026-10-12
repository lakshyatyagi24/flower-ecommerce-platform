import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', async () => {
  const h = await import('./helpers');
  return { usePathname: () => h.nav.pathname, useRouter: () => ({ push: h.push }), useSearchParams: () => new URLSearchParams() };
});
vi.mock('@/lib/auth-context', async () => {
  const h = await import('./helpers');
  return { useAuth: () => h.auth };
});
vi.mock('@/lib/cart-context', async () => {
  const h = await import('./helpers');
  return { useCart: () => h.cart, formatINR: (n: number) => `₹${n}` };
});
vi.mock('@/lib/api', async () => {
  const h = await import('./helpers');
  return { api: { listCategories: (...a: unknown[]) => h.listCategories(...a) } };
});
vi.mock('@/components/SignInModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Sign in modal">
      <button onClick={onClose}>close modal</button>
    </div>
  ),
}));

import Navbar from '../../Navbar';
import { OCCASIONS } from '@/lib/occasions';
import { resetChromeMocks, auth, cart, push, nav } from './helpers';

beforeEach(() => resetChromeMocks());

describe('Navbar server HTML', () => {
  it('contains the primary links and every occasion link as static markup', () => {
    const html = renderToString(<Navbar />);
    for (const href of ['/products', '/corporate', '/about']) expect(html).toContain(`href="${href}"`);
    for (const o of OCCASIONS) expect(html).toContain(`href="/occasions/${o.slug}"`);
    expect(html).not.toMatch(/same-day|free delivery/i);
  });
});

describe('Navbar', () => {
  it('has a labelled primary nav with Flowers, Occasions, Corporate and About; no Track order in the bar', () => {
    render(<Navbar />);
    const primary = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(primary).getByRole('link', { name: 'Flowers' })).toHaveAttribute('href', '/products');
    expect(within(primary).getByRole('button', { name: /Occasions/ })).toBeInTheDocument();
    expect(within(primary).getByRole('link', { name: 'Corporate' })).toHaveAttribute('href', '/corporate');
    expect(within(primary).getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    expect(screen.queryByRole('link', { name: /track order/i })).toBeNull();
  });

  it('hides the cart badge at 0 and shows the count in the label otherwise', () => {
    const { unmount } = render(<Navbar />);
    expect(screen.getByRole('button', { name: 'Open bag' })).toBeInTheDocument();
    expect(screen.queryByTestId('cart-badge')).toBeNull();
    unmount();
    cart.count = 3;
    render(<Navbar />);
    const btn = screen.getByRole('button', { name: 'Open bag, 3 items' });
    expect(within(btn).getByTestId('cart-badge')).toHaveTextContent('3');
  });

  it('opens the drawer from the bag button', async () => {
    render(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: 'Open bag' }));
    expect(cart.open).toHaveBeenCalled();
  });

  it('opens the existing sign-in modal for guests', async () => {
    render(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('dialog', { name: 'Sign in modal' })).toBeInTheDocument();
    await userEvent.click(screen.getByText('close modal'));
    expect(screen.queryByRole('dialog', { name: 'Sign in modal' })).toBeNull();
  });

  it('shows an account menu with My orders, Track order and Sign out when logged in', async () => {
    auth.user = { name: 'Asha Rao', email: 'asha@example.com' };
    render(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: /Account/ }));
    expect(screen.getByRole('link', { name: 'My orders' })).toHaveAttribute('href', '/account/orders');
    expect(screen.getByRole('link', { name: 'Track order' })).toHaveAttribute('href', '/track-order');
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(auth.logout).toHaveBeenCalled();
  });

  it('search icon opens a labelled form that navigates to /products?q=', async () => {
    render(<Navbar />);
    expect(screen.queryByRole('searchbox')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    const box = screen.getByRole('searchbox', { name: 'Search flowers' });
    expect(box).toHaveFocus();
    await userEvent.type(box, 'red roses{Enter}');
    expect(push).toHaveBeenCalledWith('/products?q=red%20roses');
  });

  it('does not navigate on an empty search and Escape closes and refocuses the trigger', async () => {
    render(<Navbar />);
    const trigger = screen.getByRole('button', { name: 'Search' });
    await userEvent.click(trigger);
    await userEvent.type(screen.getByRole('searchbox'), '{Enter}');
    expect(push).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('marks the current section with aria-current', () => {
    nav.pathname = '/corporate';
    render(<Navbar />);
    expect(screen.getByRole('link', { name: 'Corporate' })).toHaveAttribute('aria-current', 'page');
  });

  it('styles the current page link with an underline (aria-current variant)', () => {
    render(<Navbar />);
    expect(screen.getByRole('link', { name: 'Flowers' }).className).toContain('aria-[current=page]:underline');
  });

  it('only sets aria-controls on search while its panel exists', async () => {
    render(<Navbar />);
    const trigger = screen.getByRole('button', { name: 'Search' });
    expect(trigger).not.toHaveAttribute('aria-controls');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-controls');
  });
});
