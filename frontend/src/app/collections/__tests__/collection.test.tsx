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
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  permanentRedirect: (u: string) => {
    throw new Error(`NEXT_REDIRECT:${u}`);
  },
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/cart-context', () => ({ useCart: () => ({ add: vi.fn() }) }));

import CollectionPage, { generateMetadata, dynamic } from '../[slug]/page';

const mk = (id: number, name: string): ApiProduct => ({
  id, name, slug: name.toLowerCase().replace(/ /g, '-'), description: null, price: 100 * id, image: null,
  stock: 5, featured: false, active: true, categoryId: 1, saleMode: 'PURCHASE',
});
const cats = [
  { id: 1, name: 'Cut Flowers', slug: 'cut-flowers', active: true, description: 'Choose cut flowers by the bunch, in many colours.', children: [{ id: 5, name: 'Roses', slug: 'roses', active: true }] },
  { id: 2, name: 'Plants', slug: 'plants', active: true, description: null },
  { id: 3, name: 'Hidden', slug: 'hidden', active: false },
];
const props = (slug: string, searchParams: Record<string, string> = {}) => ({ params: { slug }, searchParams });

describe('collection page', () => {
  beforeEach(() => {
    listProducts.mockReset().mockResolvedValue({ items: [mk(1, 'Red Rose'), mk(2, 'Pink Rose')], total: 2, page: 1, pages: 1, take: 24 });
    listCategories.mockReset().mockResolvedValue(cats);
  });

  it('is force-dynamic (R1)', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('404s for an unknown, inactive or wrongly-cased slug, in both page and metadata', async () => {
    for (const slug of ['nope', 'hidden', 'Plants']) {
      await expect(CollectionPage(props(slug))).rejects.toThrow('NEXT_NOT_FOUND');
      await expect(generateMetadata(props(slug))).rejects.toThrow('NEXT_NOT_FOUND');
    }
  });

  it('finds nested categories', async () => {
    render(await CollectionPage(props('roses')));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Roses');
  });

  it('fetches products for the path category, ignoring category/tag in the query string', async () => {
    await CollectionPage(props('plants', { category: 'cut-flowers', tag: 'birthday', sort: 'price_asc', page: '1' }));
    expect(listProducts).toHaveBeenCalledWith({ category: 'plants', tag: undefined, sort: 'price_asc', q: undefined, page: 1, take: 24 });
  });

  it('renders heading, the category description as intro, products, breadcrumb and ItemList JSON-LD', async () => {
    const { container } = render(await CollectionPage(props('cut-flowers')));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Cut Flowers');
    expect(screen.getByText('Choose cut flowers by the bunch, in many colours.')).toBeTruthy();
    expect(screen.getByRole('link', { name: /red rose/i }).getAttribute('href')).toBe('/products/red-rose');
    const lds = [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!));
    const bc = lds.find((l) => l['@type'] === 'BreadcrumbList');
    expect(bc.itemListElement.map((i: { name: string; item: string }) => [i.name, i.item])).toEqual([
      ['Home', 'https://freshpetalsindia.com/'],
      ['Cut Flowers', 'https://freshpetalsindia.com/collections/cut-flowers'],
    ]);
    expect(lds.find((l) => l['@type'] === 'ItemList').itemListElement).toHaveLength(2);
  });

  it('falls back to a neutral sentence when the category has no description', async () => {
    render(await CollectionPage(props('plants')));
    expect(screen.getByText('Browse our Plants — hand-selected stems and arrangements.')).toBeTruthy();
  });

  it('links related collections (not itself) and every occasion', async () => {
    render(await CollectionPage(props('cut-flowers')));
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/collections/plants');
    expect(hrefs).toContain('/occasions/wedding');
    const more = screen.getByRole('heading', { name: 'More collections' }).closest('section')!;
    expect([...more.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/collections/plants']);
  });

  it('paginates under /collections/<slug>', async () => {
    listProducts.mockResolvedValue({ items: [mk(1, 'Red Rose')], total: 60, page: 2, pages: 3, take: 24 });
    render(await CollectionPage(props('plants', { page: '2', sort: 'popular' })));
    expect(screen.getByRole('link', { name: 'Next' }).getAttribute('href')).toBe('/collections/plants?sort=popular&page=3');
  });

  it('404s past the last page but renders an empty first page (200) with an EmptyState', async () => {
    await expect(CollectionPage(props('plants', { page: '9' }))).rejects.toThrow('NEXT_NOT_FOUND');
    listProducts.mockResolvedValue({ items: [], total: 0, page: 1, pages: 0, take: 24 });
    render(await CollectionPage(props('plants')));
    expect(screen.getByText('New stems coming soon')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Browse all flowers' }).getAttribute('href')).toBe('/products');
  });

  it('propagates a category-list or products outage so error.tsx renders (never a soft 200/404)', async () => {
    listCategories.mockRejectedValue(new Error('categories down'));
    await expect(CollectionPage(props('plants'))).rejects.toThrow('categories down');
    listCategories.mockResolvedValue(cats);
    listProducts.mockRejectedValue(new Error('products down'));
    await expect(CollectionPage(props('plants'))).rejects.toThrow('products down');
  });
});

describe('collection metadata', () => {
  beforeEach(() => {
    listProducts.mockReset().mockResolvedValue({ items: [mk(1, 'Red Rose')], total: 1, page: 1, pages: 1, take: 24 });
    listCategories.mockReset().mockResolvedValue(cats);
  });

  it('title is short and brand-free (the layout template adds the brand), description from the intro, canonical is the collection', async () => {
    const m = await generateMetadata(props('cut-flowers', { sort: 'popular' }));
    expect(m.title).toBe('Cut Flowers — Buy Online');
    expect((m.title as string).length + ' · Fresh Petals India'.length).toBeLessThanOrEqual(60);
    expect(m.description).toBe('Choose cut flowers by the bunch, in many colours.');
    expect(m.alternates?.canonical).toBe('/collections/cut-flowers');
    expect(m.robots).toBeUndefined();
  });

  it('uses the neutral fallback for the description when the category has none, and caps at 155 chars', async () => {
    expect((await generateMetadata(props('plants'))).description).toBe('Browse our Plants — hand-selected stems and arrangements.');
    listCategories.mockResolvedValue([{ id: 1, name: 'Long', slug: 'long', description: 'word '.repeat(80) }]);
    expect(((await generateMetadata(props('long'))).description as string).length).toBeLessThanOrEqual(155);
  });

  it('page > 1: canonical keeps the page, title and description get a Page N suffix', async () => {
    listProducts.mockResolvedValue({ items: [mk(1, 'Red Rose')], total: 60, page: 3, pages: 3, take: 24 });
    const m = await generateMetadata(props('plants', { page: '3' }));
    expect(m.alternates?.canonical).toBe('/collections/plants?page=3');
    expect(m.title).toBe('Plants — Buy Online — Page 3');
    expect(m.description).toMatch(/ — Page 3$/);
    expect((m.description as string).length).toBeLessThanOrEqual(155);
  });

  it('is noindex,follow when empty or searched, and a search canonicalises to the collection', async () => {
    listProducts.mockResolvedValue({ items: [], total: 0, page: 1, pages: 0, take: 24 });
    expect((await generateMetadata(props('plants'))).robots).toEqual({ index: false, follow: true });
    listProducts.mockResolvedValue({ items: [mk(1, 'Red Rose')], total: 1, page: 1, pages: 1, take: 24 });
    const m = await generateMetadata(props('plants', { q: 'rose', page: '1' }));
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.alternates?.canonical).toBe('/collections/plants');
  });
});
