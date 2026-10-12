import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiProduct } from '@/lib/api';
import { getOccasion } from '@/lib/occasions';

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

import OccasionPage, { generateMetadata, dynamic } from '../[slug]/page';

const mk = (id: number, name: string): ApiProduct => ({
  id, name, slug: name.toLowerCase().replace(/ /g, '-'), description: null, price: 100 * id, image: null,
  stock: 5, featured: false, active: true, categoryId: 1, saleMode: 'PURCHASE',
});
const cats = [
  { id: 1, name: 'Cut Flowers', slug: 'cut-flowers', active: true },
  { id: 2, name: 'Plants', slug: 'plants', active: true },
];
const props = (slug: string, searchParams: Record<string, string> = {}) => ({ params: { slug }, searchParams });

describe('occasion page', () => {
  beforeEach(() => {
    listProducts.mockReset().mockResolvedValue({ items: [mk(1, 'Red Rose'), mk(2, 'Pink Rose')], total: 2, page: 1, pages: 1, take: 24 });
    listCategories.mockReset().mockResolvedValue(cats);
  });

  it('is force-dynamic (R1)', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('404s for an unknown slug without calling the API', async () => {
    await expect(OccasionPage(props('christmas'))).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(generateMetadata(props('christmas'))).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(OccasionPage(props('__proto__'))).rejects.toThrow('NEXT_NOT_FOUND');
    expect(listProducts).not.toHaveBeenCalled();
  });

  it('308s an upper-case occasion slug to the lower-case page, 404s unknown ones', async () => {
    await expect(OccasionPage(props('Birthday', { sort: 'popular' }))).rejects.toThrow('NEXT_REDIRECT:/occasions/birthday?sort=popular');
    await expect(generateMetadata(props('GET-WELL-SOON'))).rejects.toThrow('NEXT_REDIRECT:/occasions/get-well-soon');
    await expect(OccasionPage(props('Christmas'))).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('a search with no results offers Clear filters back to the occasion page', async () => {
    listProducts.mockResolvedValue({ items: [], total: 0, page: 1, pages: 0, take: 24 });
    render(await OccasionPage(props('birthday', { q: 'zzz' })));
    expect(screen.getByRole('link', { name: 'Clear filters' }).getAttribute('href')).toBe('/occasions/birthday');
  });

  it('does not link empty collections', async () => {
    listCategories.mockResolvedValue([{ ...cats[0], productCount: 3 }, { ...cats[1], productCount: 0 }]);
    render(await OccasionPage(props('birthday')));
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/collections/cut-flowers');
    expect(hrefs).not.toContain('/collections/plants');
  });

  it('filters by the occasion tag and ignores tag/category in the query string', async () => {
    await OccasionPage(props('birthday', { tag: 'wedding', category: 'plants', sort: 'popular' }));
    expect(listProducts).toHaveBeenCalledWith({ category: undefined, tag: 'birthday', sort: 'popular', q: undefined, page: 1, take: 24 });
  });

  it('renders eyebrow, heading, the editorial intro, products and both JSON-LD blocks', async () => {
    const { container } = render(await OccasionPage(props('birthday')));
    expect(screen.getByText('Shop by occasion', { selector: 'p' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Birthday flowers');
    expect(screen.getByText(getOccasion('birthday')!.intro)).toBeTruthy();
    expect(screen.getByRole('link', { name: /red rose/i })).toBeTruthy();
    const lds = [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!));
    expect(lds.map((l) => l['@type']).sort()).toEqual(['BreadcrumbList', 'ItemList']);
    expect(lds.find((l) => l['@type'] === 'BreadcrumbList').itemListElement[1].item).toBe('https://freshpetalsindia.com/occasions/birthday');
  });

  it('links the other occasions (not itself) and the collections', async () => {
    render(await OccasionPage(props('birthday')));
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/occasions/wedding');
    expect(hrefs).not.toContain('/occasions/birthday');
    expect(hrefs).toContain('/collections/cut-flowers');
  });

  it('has no category filter bar but still sorts and paginates on its own path', async () => {
    listProducts.mockResolvedValue({ items: [mk(1, 'Red Rose')], total: 60, page: 1, pages: 3, take: 24 });
    render(await OccasionPage(props('wedding')));
    expect(screen.queryByRole('navigation', { name: 'Categories' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Next' }).getAttribute('href')).toBe('/occasions/wedding?page=2');
  });

  it('still renders when the category list is unavailable (related collections degrade)', async () => {
    listCategories.mockRejectedValue(new Error('x'));
    render(await OccasionPage(props('birthday')));
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'More collections' })).toBeNull();
  });

  it('404s past the last page; an empty occasion renders 200 with an EmptyState', async () => {
    await expect(OccasionPage(props('birthday', { page: '9' }))).rejects.toThrow('NEXT_NOT_FOUND');
    listProducts.mockResolvedValue({ items: [], total: 0, page: 1, pages: 0, take: 24 });
    render(await OccasionPage(props('sympathy')));
    expect(screen.getByText('New stems coming soon')).toBeTruthy();
  });

  it('propagates a products outage so error.tsx renders', async () => {
    listProducts.mockRejectedValue(new Error('API down'));
    await expect(OccasionPage(props('birthday'))).rejects.toThrow('API down');
  });
});

describe('occasion metadata', () => {
  beforeEach(() => {
    listProducts.mockReset().mockResolvedValue({ items: [mk(1, 'Red Rose')], total: 1, page: 1, pages: 1, take: 24 });
    listCategories.mockReset().mockResolvedValue(cats);
  });

  it('uses the occasion title and description with canonical /occasions/<slug>, indexable', async () => {
    const o = getOccasion('anniversary')!;
    const m = await generateMetadata(props('anniversary', { sort: 'popular' }));
    expect(m.title).toBe(o.title);
    expect(m.description).toBe(o.metaDescription);
    expect(m.alternates?.canonical).toBe('/occasions/anniversary');
    expect(m.robots).toBeUndefined();
  });

  it('page > 1 canonicalises with the page and suffixes the title', async () => {
    listProducts.mockResolvedValue({ items: [mk(1, 'Red Rose')], total: 60, page: 2, pages: 3, take: 24 });
    const m = await generateMetadata(props('anniversary', { page: '2' }));
    expect(m.alternates?.canonical).toBe('/occasions/anniversary?page=2');
    expect(m.title).toBe('Anniversary Flowers Online — Page 2');
    expect((m.description as string).length).toBeLessThanOrEqual(155);
  });

  it('is noindex,follow when empty or when searching', async () => {
    listProducts.mockResolvedValue({ items: [], total: 0, page: 1, pages: 0, take: 24 });
    expect((await generateMetadata(props('sympathy'))).robots).toEqual({ index: false, follow: true });
    listProducts.mockResolvedValue({ items: [mk(1, 'Red Rose')], total: 1, page: 1, pages: 1, take: 24 });
    const m = await generateMetadata(props('sympathy', { q: 'lily' }));
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.alternates?.canonical).toBe('/occasions/sympathy');
  });
});
