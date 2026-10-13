import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError, type ApiProduct } from '../api';
import { clearFreshProductCache, fetchFreshProducts } from '../fresh-products';

const product = (slug: string, id = 1): ApiProduct =>
  ({ id, slug, name: slug, price: 10, stock: 5, featured: false, active: true, categoryId: null, description: null, image: null }) as ApiProduct;

beforeEach(() => clearFreshProductCache());

describe('fetchFreshProducts', () => {
  it('requests each slug once even when lines share it', async () => {
    const getProduct = vi.fn(async (s: string) => product(s));
    const res = await fetchFreshProducts(
      [
        { productId: 1, slug: 'a' },
        { productId: 1, slug: 'a' },
        { productId: 2, slug: 'b' },
      ],
      { getProduct },
    );
    expect(getProduct).toHaveBeenCalledTimes(2);
    expect(res.fresh.map((p) => p.slug)).toEqual(['a', 'b']);
    expect(res.failed).toBe(false);
    expect(res.unverified).toEqual([]);
  });

  it('never runs more than the concurrency limit at once', async () => {
    let active = 0;
    let peak = 0;
    const getProduct = vi.fn(async (s: string) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return product(s);
    });
    const lines = Array.from({ length: 9 }, (_, i) => ({ productId: i + 1, slug: `p${i}` }));
    const res = await fetchFreshProducts(lines, { getProduct, concurrency: 3 });
    expect(res.fresh).toHaveLength(9);
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(1);
  });

  it('a 404 means the product is gone: absent from fresh, not unverified, not a failure', async () => {
    const getProduct = vi.fn(async (s: string) => {
      if (s === 'gone') throw new ApiError('not found', 404, null);
      return product(s);
    });
    const res = await fetchFreshProducts(
      [
        { productId: 1, slug: 'gone' },
        { productId: 2, slug: 'ok' },
      ],
      { getProduct },
    );
    expect(res.fresh.map((p) => p.slug)).toEqual(['ok']);
    expect(res.unverified).toEqual([]);
    expect(res.failed).toBe(false);
  });

  it('any other failure is reported as unverified and never thrown', async () => {
    const getProduct = vi.fn(async (s: string) => {
      if (s === 'down') throw new ApiError('boom', 500, null);
      if (s === 'net') throw new TypeError('Failed to fetch');
      return product(s);
    });
    const res = await fetchFreshProducts(
      [
        { productId: 1, slug: 'down' },
        { productId: 2, slug: 'net' },
        { productId: 3, slug: 'ok' },
      ],
      { getProduct },
    );
    expect(res.unverified).toEqual([1, 2]);
    expect(res.failed).toBe(true);
    expect(res.fresh.map((p) => p.slug)).toEqual(['ok']);
  });

  it('an empty bag makes no requests', async () => {
    const getProduct = vi.fn();
    const res = await fetchFreshProducts([], { getProduct });
    expect(getProduct).not.toHaveBeenCalled();
    expect(res).toEqual({ fresh: [], unverified: [], failed: false });
  });

  it('reuses a recent answer, but maxAgeMs: 0 always asks again', async () => {
    const getProduct = vi.fn(async (s: string) => product(s));
    const lines = [{ productId: 1, slug: 'a' }];
    await fetchFreshProducts(lines, { getProduct });
    await fetchFreshProducts(lines, { getProduct });
    expect(getProduct).toHaveBeenCalledTimes(1);
    await fetchFreshProducts(lines, { getProduct, maxAgeMs: 0 });
    expect(getProduct).toHaveBeenCalledTimes(2);
  });

  it('an expired cache entry is refreshed', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-13T10:00:00Z') });
    try {
      const getProduct = vi.fn(async (s: string) => product(s));
      const lines = [{ productId: 1, slug: 'a' }];
      await fetchFreshProducts(lines, { getProduct, maxAgeMs: 1000 });
      vi.setSystemTime(new Date('2026-10-13T10:00:05Z'));
      await fetchFreshProducts(lines, { getProduct, maxAgeMs: 1000 });
      expect(getProduct).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a product that disappears is no longer served from the cache', async () => {
    const lines = [{ productId: 1, slug: 'a' }];
    await fetchFreshProducts(lines, { getProduct: async (s) => product(s) });
    const res = await fetchFreshProducts(lines, {
      maxAgeMs: 0,
      getProduct: async () => {
        throw new ApiError('not found', 404, null);
      },
    });
    expect(res.fresh).toEqual([]);
    const again = await fetchFreshProducts(lines, {
      getProduct: async () => {
        throw new ApiError('not found', 404, null);
      },
    });
    expect(again.fresh).toEqual([]);
  });
});
