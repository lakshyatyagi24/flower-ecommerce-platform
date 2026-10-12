import { describe, it, expect, vi, beforeEach } from 'vitest';

const listProducts = vi.fn();
vi.mock('@/lib/server-api', () => ({ listProducts: (...a: unknown[]) => listProducts(...a) }));

import sitemap, { dynamic, limitEntries } from '../sitemap';

const prod = (slug: string, extra: Record<string, unknown> = {}) => ({ id: slug, slug, active: true, updatedAt: '2026-03-01T10:00:00.000Z', ...extra });
const page = (items: unknown[], pageNo: number, pages: number) => ({ items, total: items.length, page: pageNo, pages, take: 200 });

beforeEach(() => {
  listProducts.mockReset();
});

describe('sitemap', () => {
  it('is force-dynamic (R1: no API at build time)', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('lists static pages and active products with absolute URLs, no priority/changeFrequency', async () => {
    listProducts.mockResolvedValue(page([prod('red-rose'), prod('hidden', { active: false })], 1, 1));
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
    listProducts.mockResolvedValue(page([prod('a'), prod('b', { updatedAt: 'garbage' }), prod('c', { updatedAt: undefined })], 1, 1));
    const out = await sitemap();
    const get = (s: string) => out.find((e) => e.url.endsWith(`/products/${s}`))!;
    expect(get('a').lastModified).toEqual(new Date('2026-03-01T10:00:00.000Z'));
    expect(get('b').lastModified).toBeUndefined();
    expect(get('c').lastModified).toBeUndefined();
  });

  it('pages through the API until pages is exhausted', async () => {
    listProducts
      .mockResolvedValueOnce(page([prod('p1')], 1, 3))
      .mockResolvedValueOnce(page([prod('p2')], 2, 3))
      .mockResolvedValueOnce(page([prod('p3')], 3, 3));
    const out = await sitemap();
    expect(listProducts).toHaveBeenCalledTimes(3);
    expect(listProducts).toHaveBeenNthCalledWith(1, { page: 1, take: 200 });
    expect(listProducts).toHaveBeenNthCalledWith(3, { page: 3, take: 200 });
    expect(out.map((e) => e.url)).toEqual(expect.arrayContaining(['p1', 'p2', 'p3'].map((s) => `https://freshpetalsindia.com/products/${s}`)));
  });

  it('caps paging at 50 pages', async () => {
    listProducts.mockImplementation(async (a: { page: number }) => page([prod(`s${a.page}`)], a.page, 9999));
    await sitemap();
    expect(listProducts).toHaveBeenCalledTimes(50);
  });

  it('de-duplicates URLs', async () => {
    listProducts
      .mockResolvedValueOnce(page([prod('dup'), prod('dup')], 1, 2))
      .mockResolvedValueOnce(page([prod('dup')], 2, 2));
    const out = await sitemap();
    expect(out.filter((e) => e.url.endsWith('/products/dup'))).toHaveLength(1);
  });

  it('throws on API failure (5xx, never an empty/partial 200)', async () => {
    listProducts.mockResolvedValueOnce(page([prod('p1')], 1, 2)).mockRejectedValueOnce(new Error('API down'));
    await expect(sitemap()).rejects.toThrow('API down');
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
