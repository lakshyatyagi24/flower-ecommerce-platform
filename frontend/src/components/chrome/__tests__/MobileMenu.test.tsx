import React from 'react';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', async () => {
  const h = await import('./helpers');
  return { usePathname: () => h.nav.pathname, useRouter: () => ({ push: h.push }) };
});
vi.mock('@/lib/auth-context', async () => {
  const h = await import('./helpers');
  return { useAuth: () => h.auth };
});
vi.mock('@/lib/cart-context', async () => {
  const h = await import('./helpers');
  return { useCart: () => h.cart };
});
vi.mock('@/lib/api', async () => {
  const h = await import('./helpers');
  return { api: { listCategories: (...a: unknown[]) => h.listCategories(...a) } };
});
vi.mock('@/components/SignInModal', () => ({
  default: () => <div role="dialog" aria-label="Sign in modal" />,
}));

import Navbar from '../../Navbar';
import { OCCASIONS } from '@/lib/occasions';
import { resetChromeMocks, auth, nav } from './helpers';

beforeEach(() => {
  resetChromeMocks();
  document.body.style.overflow = '';
});

const open = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  return screen.getByRole('dialog', { name: 'Menu' });
};

describe('Mobile menu', () => {
  it('opens a modal dialog with the large links and closes with the close button, returning focus', async () => {
    render(<Navbar />);
    const trigger = screen.getByRole('button', { name: 'Open menu' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const dialog = await open();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    for (const [name, href] of [
      ['Flowers', '/products'],
      ['Corporate', '/corporate'],
      ['About', '/about'],
      ['Track order', '/track-order'],
      ['Contact', '/contact'],
    ]) {
      expect(within(dialog).getByRole('link', { name })).toHaveAttribute('href', href);
    }
    expect(within(dialog).getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close menu' }));
    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('expands the occasions list', async () => {
    render(<Navbar />);
    const dialog = await open();
    const exp = within(dialog).getByRole('button', { name: /Occasions/ });
    expect(exp).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(exp);
    expect(exp).toHaveAttribute('aria-expanded', 'true');
    expect(within(dialog).getByRole('link', { name: OCCASIONS[0].name })).toHaveAttribute(
      'href',
      `/occasions/${OCCASIONS[0].slug}`,
    );
  });

  it('shows My orders and Sign out when logged in', async () => {
    auth.user = { name: 'Asha', email: 'a@b.co' };
    render(<Navbar />);
    const dialog = await open();
    expect(within(dialog).getByRole('link', { name: 'My orders' })).toHaveAttribute('href', '/account/orders');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Sign out' }));
    expect(auth.logout).toHaveBeenCalled();
  });

  it('locks body scroll while open and restores it on close', async () => {
    document.body.style.overflow = 'auto';
    render(<Navbar />);
    await open();
    expect(document.body.style.overflow).toBe('hidden');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('restores scroll when unmounted while open', async () => {
    const { unmount } = render(<Navbar />);
    await open();
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('traps Tab inside the dialog in both directions', async () => {
    render(<Navbar />);
    const dialog = await open();
    expect(dialog.contains(document.activeElement)).toBe(true);
    for (let i = 0; i < 25; i += 1) {
      await userEvent.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    within(dialog).getByRole('button', { name: 'Close menu' }).focus();
    await userEvent.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('closes when the route changes', async () => {
    const { rerender } = render(<Navbar />);
    await open();
    nav.pathname = '/about';
    rerender(<Navbar />);
    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
  });

  it('opens the sign-in modal from the menu', async () => {
    render(<Navbar />);
    const dialog = await open();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('dialog', { name: 'Sign in modal' })).toBeInTheDocument();
  });

  it('only points aria-controls at the menu while it is open', async () => {
    render(<Navbar />);
    const trigger = screen.getByRole('button', { name: 'Open menu' });
    expect(trigger).not.toHaveAttribute('aria-controls');
    await open();
    expect(trigger).toHaveAttribute('aria-controls', 'mobile-menu');
    expect(document.getElementById('mobile-menu')).not.toBeNull();
  });

  it('closes when the viewport crosses the lg breakpoint', async () => {
    let handler: ((e: { matches: boolean }) => void) | null = null;
    const mql = {
      matches: false,
      addEventListener: (_: string, h: any) => (handler = h),
      removeEventListener: () => (handler = null),
    };
    const original = window.matchMedia;
    window.matchMedia = vi.fn(() => mql) as any;
    render(<Navbar />);
    await open();
    act(() => handler!({ matches: true }));
    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
    window.matchMedia = original;
  });

  it('keeps the wordmark in the same grid cell as the header', async () => {
    render(<Navbar />);
    const dialog = await open();
    const link = within(dialog).getByRole('link', { name: 'Fresh Petals' });
    expect(link.parentElement!.className).toContain('grid-cols-[1fr_auto_1fr]');
  });
});
