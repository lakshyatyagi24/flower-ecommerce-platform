import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;
const fail = (status: number) => ({ ok: false, status, json: async () => ({}) }) as Response;

async function load() {
  vi.resetModules();
  return import('../server-api');
}

describe('server-api', () => {
  const fetchMock = vi.fn();
  const env = { ...process.env };
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    delete process.env.API_BASE_INTERNAL;
    delete process.env.NEXT_PUBLIC_API_BASE;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...env };
  });

  it('defaults the base URL to localhost:3001', async () => {
    fetchMock.mockResolvedValue(ok([]));
    const { listCategories } = await load();
    await listCategories();
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3001/categories');
  });

  it('prefers API_BASE_INTERNAL over NEXT_PUBLIC_API_BASE', async () => {
    process.env.API_BASE_INTERNAL = 'http://internal:3001';
    process.env.NEXT_PUBLIC_API_BASE = 'https://public.example';
    fetchMock.mockResolvedValue(ok([]));
    const { listCategories } = await load();
    await listCategories();
    expect(fetchMock.mock.calls[0][0]).toBe('http://internal:3001/categories');
  });

  it('falls back to NEXT_PUBLIC_API_BASE', async () => {
    process.env.NEXT_PUBLIC_API_BASE = 'https://public.example';
    fetchMock.mockResolvedValue(ok([]));
    const { listCategories } = await load();
    await listCategories();
    expect(fetchMock.mock.calls[0][0]).toBe('https://public.example/categories');
  });

  it('getProduct returns null on 404, throws on other errors, encodes the slug', async () => {
    const { getProduct } = await load();
    fetchMock.mockResolvedValueOnce(fail(404));
    expect(await getProduct('nope')).toBeNull();
    fetchMock.mockResolvedValueOnce(fail(500));
    await expect(getProduct('x')).rejects.toThrow();
    fetchMock.mockResolvedValueOnce(ok({ id: 1, slug: 'a b' }));
    await getProduct('a b');
    expect(fetchMock.mock.calls[2][0]).toBe('http://localhost:3001/products/slug/a%20b');
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ next: { revalidate: 60 } });
  });

  it('listProducts builds the query from set values only', async () => {
    fetchMock.mockResolvedValue(ok({ items: [], total: 0, take: 24, skip: 0, page: 1, pages: 0 }));
    const { listProducts } = await load();
    await listProducts({ category: 'roses', sort: 'price_asc', page: 2, take: 24, q: undefined, tag: '' });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/products');
    expect(Object.fromEntries(url.searchParams)).toEqual({ category: 'roses', sort: 'price_asc', page: '2', take: '24' });
    await listProducts({});
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:3001/products');
    await listProducts({ featured: false });
    expect(fetchMock.mock.calls[2][0]).toBe('http://localhost:3001/products?featured=false');
  });

  it('listProducts returns the paging shape and throws when not ok', async () => {
    const { listProducts } = await load();
    fetchMock.mockResolvedValueOnce(ok({ items: [{ id: 1 }], total: 40, take: 24, skip: 0, page: 1, pages: 2, extra: 1 }));
    expect(await listProducts({})).toEqual({ items: [{ id: 1 }], total: 40, page: 1, pages: 2, take: 24 });
    fetchMock.mockResolvedValueOnce(fail(503));
    await expect(listProducts({})).rejects.toThrow(/503/);
  });

  it('getSettings revalidates every 300s', async () => {
    fetchMock.mockResolvedValue(ok({ a: 'b' }));
    const { getSettings } = await load();
    expect(await getSettings()).toEqual({ a: 'b' });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ next: { revalidate: 300 } });
  });
});
