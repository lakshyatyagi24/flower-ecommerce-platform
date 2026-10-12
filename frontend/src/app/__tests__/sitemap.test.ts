import { describe, it, expect, vi, beforeEach } from 'vitest';

const listProductsRaw = vi.fn();
const listCategories = vi.fn();
// Landing-page count probes (`take: 1` with a category/tag) are answered by `landingTotals`; everything else is the product paging loop.
let landingTotals: Record<string, number> = {};
const listProducts = vi.fn(async (a: { category?: string; tag?: string; take?: number; page?: number }) => {
  if (a.category || a.tag) return { items: [], total: landingTotals[(a.category ?? a.tag)!] ?? 0, page: 1, pages: 1, take: 1 };
  return listProductsRaw(a);
});
vi.mock('@/lib/server-api', () => ({
  listProducts: (...a: unknown[]) => listProducts(...(a as [never])),
  listCategories: (...a: unknown[]) => listCategories(...a),
}));

import sitemap, { dynamic, limitEntries } from '../sitemap';

const prod = (slug: string, extra: Record<string, unknown> = {}) => ({ id: slug, slug, active: true, updatedAt: '2026-03-01T10:00:00.000Z', ...extra });
const page = (items: unknown[], pageNo: number, pages: number) => ({ items, total: items.length, page: pageNo, pages, take: 200 });

beforeEach(() => {
  listProductsRaw.mockReset();
  listCategories.mockReset().mockResolvedValue([]);
  landingTotals = {};
});

describe('sitemap', () => {
  it('is force-dynamic (R1: no API at build time)', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('lists static pages and active products with absolute URLs, no priority/changeFrequency', async () => {
    listProductsRaw.mockResolvedValue(page([prod('red-rose'), prod('hidden', { active: false })], 1, 1));
    const out = await sitemap();
    const urls = out.map((e) => e.url);
    for (const p of ['/', '/products', '/about', '/contact', '/corporate', '/faq', '/privacy', '/terms', '/refund-policy']) {
      expect(urls).toContain(`https://freshpetalsindia.com${p}`);
    }
    expect(urls).toContain('https://freshpetalsindia.com/products/red-rose');
    expect(urls).not.toContain('https://freshpetalsindia.com/products/hidden');
    expect(out.every((e) => /^https:\/\//.test(e.url))).toBe(true);
    expect(out.some((e) => 'priority' in e || 'changeFrequency' in e)).toBe(false);
  });

  it('sets lastModified from updatedAt only when it is a valid date', async () => {
    listProductsRaw.mockResolvedValue(page([prod('a'), prod('b', { updatedAt: 'garbage' }), prod('c', { updatedAt: undefined })], 1, 1));
    const out = await sitemap();
    const get = (s: string) => out.find((e) => e.url.endsWith(`/products/${s}`))!;
    expect(get('a').lastModified).toEqual(new Date('2026-03-01T10:00:00.000Z'));
    expect(get('b').lastModified).toBeUndefined();
    expect(get('c').lastModified).toBeUndefined();
  });

  it('pages through the API until pages is exhausted', async () => {
    listProductsRaw
      .mockResolvedValueOnce(page([prod('p1')], 1, 3))
      .mockResolvedValueOnce(page([prod('p2')], 2, 3))
      .mockResolvedValueOnce(page([prod('p3')], 3, 3));
    const out = await sitemap();
    expect(listProductsRaw).toHaveBeenCalledTimes(3);
    expect(listProductsRaw).toHaveBeenNthCalledWith(1, { page: 1, take: 200 });
    expect(listProductsRaw).toHaveBeenNthCalledWith(3, { page: 3, take: 200 });
    expect(out.map((e) => e.url)).toEqual(expect.arrayContaining(['p1', 'p2', 'p3'].map((s) => `https://freshpetalsindia.com/products/${s}`)));
  });

  it('caps paging at 50 pages', async () => {
    listProductsRaw.mockImplementation(async (a: { page: number }) => page([prod(`s${a.page}`)], a.page, 9999));
    await sitemap();
    expect(listProductsRaw).toHaveBeenCalledTimes(50);
  });

  it('skips (with a warning) slugs that are not URL/XML safe, e.g. containing & or <', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    listProductsRaw.mockResolvedValue(page([prod('ok-slug'), prod('rose&lily'), prod('a<b'), prod('UPPER'), prod('sp ace')], 1, 1));
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain('https://freshpetalsindia.com/products/ok-slug');
    expect(urls.some((u) => /[&<> ]/.test(u))).toBe(false);
    expect(urls.filter((u) => u.includes('/products/'))).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns when the 50-page cap is hit', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    listProductsRaw.mockImplementation(async (a: { page: number }) => page([prod(`s${a.page}`.replace(/\d/g, 'x'))], a.page, 9999));
    await sitemap();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('50'));
    warn.mockRestore();
  });

  it('de-duplicates URLs', async () => {
    listProductsRaw
      .mockResolvedValueOnce(page([prod('dup'), prod('dup')], 1, 2))
      .mockResolvedValueOnce(page([prod('dup')], 2, 2));
    const out = await sitemap();
    expect(out.filter((e) => e.url.endsWith('/products/dup'))).toHaveLength(1);
  });

  it('throws on API failure (5xx, never an empty/partial 200)', async () => {
    listProductsRaw.mockResolvedValueOnce(page([prod('p1')], 1, 2)).mockRejectedValueOnce(new Error('API down'));
    await expect(sitemap()).rejects.toThrow('API down');
  });

  it('lists collections and occasions only when they have at least one product', async () => {
    listProductsRaw.mockResolvedValue(page([prod('p')], 1, 1));
    listCategories.mockResolvedValue([
      { id: 1, name: 'Roses', slug: 'roses', active: true, children: [{ id: 4, name: 'Sub', slug: 'sub', active: true }] },
      { id: 2, name: 'Plants', slug: 'plants', active: true },
      { id: 3, name: 'Hidden', slug: 'hidden', active: false },
    ]);
    landingTotals = { roses: 5, sub: 1, plants: 0, hidden: 9, birthday: 3, wedding: 0 };
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain('https://freshpetalsindia.com/collections/roses');
    expect(urls).toContain('https://freshpetalsindia.com/collections/sub');
    expect(urls).not.toContain('https://freshpetalsindia.com/collections/plants'); // empty -> noindex -> not listed
    expect(urls).not.toContain('https://freshpetalsindia.com/collections/hidden'); // inactive
    expect(urls).toContain('https://freshpetalsindia.com/occasions/birthday');
    expect(urls).not.toContain('https://freshpetalsindia.com/occasions/wedding');
    expect(urls.filter((u) => u.includes('/occasions/'))).toHaveLength(1);
    expect(listProducts).toHaveBeenCalledWith({ category: 'roses', take: 1 });
    expect(listProducts).toHaveBeenCalledWith({ tag: 'birthday', take: 1 });
  });

  it('throws when a landing-page probe or the category list fails (no partial sitemap)', async () => {
    listProductsRaw.mockResolvedValue(page([prod('p')], 1, 1));
    listCategories.mockRejectedValueOnce(new Error('categories down'));
    await expect(sitemap()).rejects.toThrow('categories down');
    listCategories.mockResolvedValue([{ id: 1, name: 'Roses', slug: 'roses', active: true }]);
    listProducts.mockRejectedValueOnce(new Error('probe down'));
    await expect(sitemap()).rejects.toThrow('probe down');
  });

  it('truncates to the 50,000 URL protocol limit with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const entries = Array.from({ length: 50001 }, (_, i) => ({ url: `https://x.test/${i}` }));
    expect(limitEntries(entries)).toHaveLength(50000);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(limitEntries(entries.slice(0, 10))).toHaveLength(10);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
