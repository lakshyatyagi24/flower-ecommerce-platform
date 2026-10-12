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
  permanentRedirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/cart-context', () => ({ useCart: () => ({ add: vi.fn() }) }));

import ProductsPage, { generateMetadata } from '../page';

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
    await ProductsPage({ searchParams: { page: 'abc', sort: 'evil', category: '../x', q: 'x'.repeat(500), tag: ['christmas', 'x'] } });
    expect(listProducts).toHaveBeenCalledWith({
      category: undefined, tag: 'christmas', sort: undefined, q: 'x'.repeat(100), page: 1, take: 24,
    });
  });

  it('renders products, crawlable category links to the collections, count, pagination and ItemList JSON-LD', async () => {
    const { container } = render(await ProductsPage({ searchParams: { page: '2' } }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Fresh cut flowers');
    expect(screen.getByRole('link', { name: /red rose/i }).getAttribute('href')).toBe('/products/red-rose');
    const nav = screen.getByRole('navigation', { name: 'Categories' });
    const labels = [...nav.querySelectorAll('a')].map((a) => a.textContent);
    expect(labels).toEqual(['All', 'Roses', 'Plants']); // inactive and child categories are not in the bar
    expect(nav.querySelector('[aria-current="page"]')!.textContent).toBe('All');
    expect([...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/products', '/collections/roses', '/collections/plants']);
    expect(screen.getByRole('link', { name: 'Next' }).getAttribute('href')).toBe('/products?page=3');
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

  it('404s for a page past the last page, but not for an empty first page', async () => {
    await expect(ProductsPage({ searchParams: { page: '9' } })).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(generateMetadata({ searchParams: { page: '9' } })).rejects.toThrow('NEXT_NOT_FOUND');
    listProducts.mockResolvedValue({ items: [], total: 0, page: 1, pages: 0, take: 24 });
    render(await ProductsPage({ searchParams: { tag: 'christmas' } }));
    expect(screen.getByText('No flowers match')).toBeTruthy();
  });

  it('404s for an unknown category slug', async () => {
    await expect(ProductsPage({ searchParams: { category: 'nope' } })).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(generateMetadata({ searchParams: { category: 'nope' } })).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('permanently redirects a known category (also nested) to its collection, keeping sort, page and search', async () => {
    await expect(ProductsPage({ searchParams: { category: 'plants', sort: 'price_asc', page: '2' } })).rejects.toThrow(
      'NEXT_REDIRECT:/collections/plants?sort=price_asc&page=2',
    );
    await expect(generateMetadata({ searchParams: { category: 'roses' } })).rejects.toThrow('NEXT_REDIRECT:/collections/roses');
    await expect(ProductsPage({ searchParams: { collection: 'sub', q: 'red' } })).rejects.toThrow('NEXT_REDIRECT:/collections/sub?q=red');
    listCategories.mockResolvedValue([{ ...cats[0], children: [{ id: 9, name: 'Child', slug: 'child' }] }]);
    await expect(ProductsPage({ searchParams: { category: 'child' } })).rejects.toThrow('NEXT_REDIRECT:/collections/child');
  });

  it('does not redirect to an inactive category (its collection page would 404)', async () => {
    render(await ProductsPage({ searchParams: { category: 'hidden' } }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Hidden');
  });

  it('permanently redirects a known occasion tag to its occasion page, keeping sort and page', async () => {
    await expect(ProductsPage({ searchParams: { tag: 'birthday', sort: 'popular', page: '3' } })).rejects.toThrow(
      'NEXT_REDIRECT:/occasions/birthday?sort=popular&page=3',
    );
    await expect(generateMetadata({ searchParams: { tag: 'get-well-soon' } })).rejects.toThrow('NEXT_REDIRECT:/occasions/get-well-soon');
  });

  it('ignores an unknown tag (no redirect, no 404)', async () => {
    render(await ProductsPage({ searchParams: { tag: 'christmas' } }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Fresh cut flowers');
  });

  it('does not 404 an unknown category when the category list is unavailable', async () => {
    listCategories.mockRejectedValue(new Error('x'));
    render(await ProductsPage({ searchParams: { category: 'nope' } }));
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
  });

  it('emits prev/next only for pages that exist', async () => {
    listProducts.mockResolvedValue({ items: [mk(1, 'Red Rose')], total: 60, page: 3, pages: 3, take: 24 });
    const { container } = render(await ProductsPage({ searchParams: { page: '3' } }));
    expect(container.querySelector('link[rel="next"]')).toBeNull();
    expect(container.querySelector('link[rel="prev"]')!.getAttribute('href')).toBe('/products?page=2');
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

  it('tag: canonical keeps an unknown tag; sort is dropped', async () => {
    const m = await generateMetadata({ searchParams: { tag: 'christmas', sort: 'popular' } });
    expect(m.title).toBe('Fresh Cut Flowers Online');
    expect(m.alternates?.canonical).toBe('/products?tag=christmas');
  });

  it('page > 1 keeps the page in the canonical', async () => {
    listProducts.mockResolvedValue({ items: [mk(1, 'Red Rose')], total: 60, page: 3, pages: 3, take: 24 });
    const m = await generateMetadata({ searchParams: { page: '3' } });
    expect(m.alternates?.canonical).toBe('/products?page=3');
  });

  it('page > 1 appends Page N to title and description', async () => {
    listProducts.mockResolvedValue({ items: [mk(1, 'Red Rose')], total: 60, page: 2, pages: 3, take: 24 });
    const m = await generateMetadata({ searchParams: { page: '2' } });
    expect(m.title).toBe('Fresh Cut Flowers Online — Page 2');
    expect(m.description).toMatch(/ — Page 2$/);
  });

  it('search: noindex,follow and canonical /products', async () => {
    const m = await generateMetadata({ searchParams: { q: 'rose' } });
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.alternates?.canonical).toBe('/products');
  });

  it('empty results are noindex', async () => {
    listProducts.mockResolvedValue({ items: [], total: 0, page: 1, pages: 0, take: 24 });
    expect((await generateMetadata({ searchParams: { tag: 'christmas' } })).robots).toEqual({ index: false, follow: true });
  });
});
