import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', async () => {
  const h = await import('./helpers');
  return { usePathname: () => h.nav.pathname, useRouter: () => ({ push: h.push }) };
});
vi.mock('@/lib/api', async () => {
  const h = await import('./helpers');
  return { api: { listCategories: (...a: unknown[]) => h.listCategories(...a) } };
});

import OccasionsMenu from '../OccasionsMenu';
import { OCCASIONS } from '@/lib/occasions';
import { resetChromeMocks, listCategories, nav } from './helpers';

const cats = [
  { id: 1, name: 'Cut Flowers', slug: 'cut-flowers', active: true, productCount: 40 },
  { id: 2, name: 'Plants', slug: 'plants', active: true, productCount: 0 },
  { id: 3, name: 'Hidden', slug: 'hidden', active: false, productCount: 5 },
  { id: 4, name: 'Arrangements', slug: 'arrangements', active: true },
];

beforeEach(() => resetChromeMocks());

const trigger = () => screen.getByRole('button', { name: /Occasions/ });

describe('OccasionsMenu', () => {
  it('is collapsed by default but keeps every occasion link in the DOM; no fetch before first open', () => {
    render(<OccasionsMenu />);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).not.toHaveAttribute('aria-controls'); // only while the panel is open
    const panel = document.querySelector('a[href^="/occasions/"]')!.closest('[hidden]') as HTMLElement;
    expect(panel.hidden).toBe(true);
    expect(panel.querySelectorAll('a[href^="/occasions/"]').length).toBe(OCCASIONS.length);
    expect(listCategories).not.toHaveBeenCalled();
  });

  it('opens on click, lists occasions and filtered categories, fetching once', async () => {
    listCategories.mockResolvedValue(cats);
    render(<OccasionsMenu />);
    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(trigger().getAttribute('aria-controls')!)).toBeVisible();
    expect(screen.getByText('Shop by occasion')).toBeVisible();
    expect(screen.getByText('Shop by flower')).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Cut Flowers' })).toHaveAttribute('href', '/collections/cut-flowers'),
    );
    expect(screen.getByRole('link', { name: 'Arrangements' })).toBeInTheDocument(); // unknown count stays
    expect(screen.queryByRole('link', { name: 'Plants' })).toBeNull(); // empty
    expect(screen.queryByRole('link', { name: 'Hidden' })).toBeNull(); // inactive
    expect(screen.getByRole('link', { name: 'All flowers' })).toHaveAttribute('href', '/products');
    await userEvent.click(trigger());
    await userEvent.click(trigger());
    expect(listCategories).toHaveBeenCalledTimes(1);
  });

  it('falls back to the static All flowers link when the categories call fails', async () => {
    listCategories.mockRejectedValue(new Error('down'));
    render(<OccasionsMenu />);
    await userEvent.click(trigger());
    await waitFor(() => expect(listCategories).toHaveBeenCalled());
    expect(screen.getByRole('link', { name: 'All flowers' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Cut Flowers' })).toBeNull();
  });

  it('closes on Escape (returning focus to the trigger), outside click, and route change', async () => {
    listCategories.mockResolvedValue([]);
    const ui = () => (
      <div>
        <OccasionsMenu />
        <button>elsewhere</button>
      </div>
    );
    const { rerender } = render(ui());
    await userEvent.click(trigger());
    await userEvent.keyboard('{Escape}');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveFocus();

    await userEvent.click(trigger());
    fireEvent.mouseDown(screen.getByText('elsewhere'));
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger());
    nav.pathname = '/products';
    rerender(ui());
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when focus leaves the menu', async () => {
    listCategories.mockResolvedValue([]);
    render(
      <div>
        <OccasionsMenu />
        <button>elsewhere</button>
      </div>,
    );
    await userEvent.click(trigger());
    screen.getByText('elsewhere').focus();
    await waitFor(() => expect(trigger()).toHaveAttribute('aria-expanded', 'false'));
  });

  it('opens on hover intent with a short delay and closes after leaving', async () => {
    vi.useFakeTimers();
    listCategories.mockResolvedValue([]);
    render(<OccasionsMenu />);
    const wrap = trigger().parentElement!;
    fireEvent.mouseEnter(wrap);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    await vi.advanceTimersByTimeAsync(200);
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.mouseLeave(wrap);
    await vi.advanceTimersByTimeAsync(300);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    vi.useRealTimers();
  });

  it('hover opens it, and a following mouse click keeps it open (then toggles normally)', async () => {
    vi.useFakeTimers();
    listCategories.mockResolvedValue([]);
    render(<OccasionsMenu />);
    const wrap = trigger().parentElement!;
    fireEvent.mouseEnter(wrap);
    await vi.advanceTimersByTimeAsync(200);
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(trigger(), { detail: 1 }); // the click that follows the hover
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(trigger(), { detail: 1 }); // the next click closes
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    vi.useRealTimers();
  });

  it('keyboard Enter after a hover-open still toggles normally', async () => {
    vi.useFakeTimers();
    listCategories.mockResolvedValue([]);
    render(<OccasionsMenu />);
    fireEvent.mouseEnter(trigger().parentElement!);
    await vi.advanceTimersByTimeAsync(200);
    fireEvent.click(trigger(), { detail: 0 }); // keyboard-generated click
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    vi.useRealTimers();
  });

  it('a plain click toggles open and closed', async () => {
    listCategories.mockResolvedValue([]);
    render(<OccasionsMenu />);
    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });
});
