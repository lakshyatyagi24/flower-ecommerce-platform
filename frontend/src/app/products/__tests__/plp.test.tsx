import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiProduct } from '@/lib/api';

const listProducts = vi.fn();
const listCategories = vi.fn();
vi.mock('@/lib/server-api', () => ({
  listProducts: (...a: unknown[]) => listProducts(...a),
  listCategories: (...a: unknown[]) => listCategories(...a),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/cart-context', () => ({ useCart: () => ({ add: vi.fn() }) }));

import ProductsPage, { generateMetadata } from '../(list)/page';

const mk = (id: number, name: string): ApiProduct => ({
  id, name, slug: name.toLowerCase().replace(/ /g, '-'), description: null, price: 100 * id, image: null,
  stock: 5, featured: false, active: true, categoryId: 1, saleMode: 'PURCHASE',
});

const cats = [
  { id: 1, name: 'Roses', slug: 'roses', active: true },
  { id: 2, name: 'Plants', slug: 'plants', active: true },
  { id: 3, name: 'Hidden', slug: 'hidden', active: false },
  { id: 4, name: 'Sub', slug: 'sub', active: true, parentId: 1 },
];

describe('products listing page', () => {
  beforeEach(() => {
    listProducts.mockReset().mockResolvedValue({ items: [mk(1, 'Red Rose'), mk(2, 'Pink Rose')], total: 30, page: 2, pages: 3, take: 24 });
    listCategories.mockReset().mockResolvedValue(cats);
  });

  it('whitelists params before calling the API', async () => {
    await ProductsPage({ searchParams: { page: 'abc', sort: 'evil', category: '../x', q: 'x'.repeat(500), tag: ['birthday', 'x'] } });
    expect(listProducts).toHaveBeenCalledWith({
      category: undefined, tag: 'birthday', sort: undefined, q: 'x'.repeat(100), page: 1, take: 24,
    });
  });

  it('renders products, crawlable category links, count, pagination and ItemList JSON-LD', async () => {
    const { container } = render(await ProductsPage({ searchParams: { category: 'roses', page: '2' } }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Roses');
    expect(screen.getByRole('link', { name: /red rose/i }).getAttribute('href')).toBe('/products/red-rose');
    const nav = screen.getByRole('navigation', { name: 'Categories' });
    const labels = [...nav.querySelectorAll('a')].map((a) => a.textContent);
    expect(labels).toEqual(['All', 'Roses', 'Plants']); // inactive and child categories are not in the bar
    expect(nav.querySelector('[aria-current="page"]')!.textContent).toBe('Roses');
    expect(screen.getByRole('link', { name: 'Next' }).getAttribute('href')).toBe('/products?category=roses&page=3');
    expect(container.textContent).toContain('30 products');
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(ld['@type']).toBe('ItemList');
    expect(ld.itemListElement).toHaveLength(2);
  });

  it('shows a "Results for" heading for q', async () => {
    render(await ProductsPage({ searchParams: { q: 'tulip' } }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Results for “tulip”');
  });

  it('shows the empty state with a clear-filters link', async () => {
    listProducts.mockResolvedValue({ items: [], total: 0, page: 1, pages: 0, take: 24 });
    render(await ProductsPage({ searchParams: { q: 'zzz' } }));
    expect(screen.getByText('No flowers match')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Clear filters' }).getAttribute('href')).toBe('/products');
  });

  it('survives a categories outage', async () => {
    listCategories.mockRejectedValue(new Error('x'));
    render(await ProductsPage({ searchParams: {} }));
    expect(screen.getByRole('link', { name: /red rose/i })).toBeTruthy();
  });

  it('propagates a products outage (error.tsx renders)', async () => {
    listProducts.mockRejectedValue(new Error('API down'));
    await expect(ProductsPage({ searchParams: {} })).rejects.toThrow('API down');
  });
});

describe('listing metadata', () => {
  beforeEach(() => {
    listProducts.mockReset().mockResolvedValue({ items: [mk(1, 'Red Rose')], total: 1, page: 1, pages: 1, take: 24 });
    listCategories.mockReset().mockResolvedValue(cats);
  });

  it('unfiltered: plain title, canonical /products, indexable', async () => {
    const m = await generateMetadata({ searchParams: {} });
    expect(m.title).toBe('Fresh Cut Flowers Online');
    expect(m.alternates?.canonical).toBe('/products');
    expect(m.robots).toBeUndefined();
  });

  it('category: title suffix and canonical keeps the category; sort is dropped', async () => {
    const m = await generateMetadata({ searchParams: { category: 'roses', sort: 'popular' } });
    expect(m.title).toBe('Fresh Cut Flowers Online — Roses');
    expect(m.alternates?.canonical).toBe('/products?category=roses');
  });

  it('page > 1 keeps the page in the canonical', async () => {
    const m = await generateMetadata({ searchParams: { category: 'roses', page: '3' } });
    expect(m.alternates?.canonical).toBe('/products?category=roses&page=3');
  });

  it('search: noindex,follow and canonical /products', async () => {
    const m = await generateMetadata({ searchParams: { q: 'rose' } });
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.alternates?.canonical).toBe('/products');
  });

  it('empty results are noindex', async () => {
    listProducts.mockResolvedValue({ items: [], total: 0, page: 1, pages: 0, take: 24 });
    expect((await generateMetadata({ searchParams: { category: 'nope' } })).robots).toEqual({ index: false, follow: true });
  });
});
