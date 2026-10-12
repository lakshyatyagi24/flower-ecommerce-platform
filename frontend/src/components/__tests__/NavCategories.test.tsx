import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const listCategories = vi.fn();
vi.mock('@/lib/api', () => ({ api: { listCategories: (...a: unknown[]) => listCategories(...a) } }));
vi.mock('../../lib/api', () => ({ api: { listCategories: (...a: unknown[]) => listCategories(...a) } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams() }));

import Footer from '../Footer';
import Categories from '../Categories';

const cats = [
  { id: 1, name: 'Cut Flowers', slug: 'cut-flowers', active: true, productCount: 95, children: [
    { id: 11, name: 'Roses', slug: 'roses', productCount: 12 },
    { id: 12, name: 'Empty Kid', slug: 'empty-kid', productCount: 0 },
  ] },
  { id: 2, name: 'Plants', slug: 'plants', active: true, productCount: 0 },
  { id: 3, name: 'Arrangements', slug: 'arrangements', active: true },
];

describe('Footer shop links', () => {
  it('lists non-empty categories from the API under /collections and hides empty ones', async () => {
    listCategories.mockResolvedValue(cats);
    render(<Footer />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Cut Flowers' })).toBeTruthy());
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/collections/cut-flowers');
    expect(hrefs).toContain('/collections/arrangements'); // unknown count stays visible
    expect(hrefs).not.toContain('/collections/plants');
  });

  it('falls back to a single All flowers link when the API fails', async () => {
    listCategories.mockRejectedValue(new Error('down'));
    render(<Footer />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'All flowers' }).getAttribute('href')).toBe('/products'));
    expect(screen.getAllByRole('link').some((a) => (a.getAttribute('href') ?? '').startsWith('/collections/'))).toBe(false);
  });
});

describe('Categories bar and mega menu', () => {
  it('hides empty categories in the bar and empty subcategories in the menu', async () => {
    listCategories.mockResolvedValue(cats);
    render(<Categories />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Cut Flowers' })).toBeTruthy());
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/collections/cut-flowers', '/collections/arrangements']);
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Cut Flowers' }).closest('li')!);
    await waitFor(() => expect(screen.getByRole('menu')).toBeTruthy());
    const menu = [...screen.getByRole('menu').querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(menu).toEqual(['/collections/roses']);
  });
});
