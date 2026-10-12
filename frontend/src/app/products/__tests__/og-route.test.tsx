import { describe, it, expect, vi, beforeEach } from 'vitest';

const getProduct = vi.fn();
vi.mock('@/lib/server-api', () => ({ getProduct: (...a: unknown[]) => getProduct(...a) }));
vi.mock('@/lib/og-font', () => ({ ogFont: async () => new ArrayBuffer(8) }));

const rendered: { el: { type: { name: string }; props: Record<string, unknown> } }[] = [];
let failTimes = 0;
vi.mock('next/og', () => ({
  ImageResponse: class {
    el: unknown;
    constructor(el: never) {
      this.el = el;
      rendered.push({ el });
    }
    async arrayBuffer() {
      if (failTimes > 0) {
        failTimes -= 1;
        throw new Error('satori exploded');
      }
      return new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
    }
  },
}));

import Image from '../[slug]/opengraph-image';

const product = { id: 1, name: 'Red Rose', slug: 'red-rose', price: 499, image: null, active: true, saleMode: 'PURCHASE' };
const SHORT = 'public, max-age=300';
const LONG = 'public, max-age=86400, stale-while-revalidate=604800';
const kind = () => rendered[rendered.length - 1].el.type.name;

beforeEach(() => {
  getProduct.mockReset().mockResolvedValue(product);
  rendered.length = 0;
  failTimes = 0;
});

describe('product opengraph-image route', () => {
  it('renders the product card (no photo) with the long cache for a placeholder-only product', async () => {
    const res = await Image({ params: { slug: 'red-rose' } });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('cache-control')).toBe(LONG);
    expect(res.headers.get('cache-control')).not.toContain('immutable');
    expect(kind()).toBe('ProductCard');
    expect(rendered[0].el.props).toMatchObject({ name: 'Red Rose', price: '₹499' });
    expect(rendered[0].el.props).not.toHaveProperty('photo');
  });

  it('omits the price for enquiry products', async () => {
    getProduct.mockResolvedValue({ ...product, saleMode: 'ENQUIRY' });
    await Image({ params: { slug: 'red-rose' } });
    expect(rendered[0].el.props.price).toBeNull();
  });

  it('redirects (307) to the transformed Cloudinary JPEG for products with a real photo', async () => {
    getProduct.mockResolvedValue({ ...product, image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' });
    const res = await Image({ params: { slug: 'red-rose' } });
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_1200,h_630,g_auto,f_jpg,q_auto/sample.jpg',
    );
    expect(rendered).toHaveLength(0);
  });

  it('renders the brand card with the short cache for unknown and inactive products', async () => {
    getProduct.mockResolvedValue(null);
    let res = await Image({ params: { slug: 'nope' } });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe(SHORT);
    expect(kind()).toBe('BrandCard');
    getProduct.mockResolvedValue({ ...product, active: false });
    res = await Image({ params: { slug: 'red-rose' } });
    expect(res.headers.get('cache-control')).toBe(SHORT);
    expect(kind()).toBe('BrandCard');
  });

  it('degrades to the brand card (short cache) when the API fails', async () => {
    getProduct.mockRejectedValue(new Error('API down'));
    const res = await Image({ params: { slug: 'red-rose' } });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe(SHORT);
    expect(kind()).toBe('BrandCard');
  });

  it('falls back to the brand card when the product card fails to render', async () => {
    failTimes = 1;
    const res = await Image({ params: { slug: 'red-rose' } });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe(SHORT);
    expect(rendered.map((r) => r.el.type.name)).toEqual(['ProductCard', 'BrandCard']);
  });

  it('returns a clean 500 (never a truncated 200) when even the brand card fails', async () => {
    failTimes = 5;
    const res = await Image({ params: { slug: 'red-rose' } });
    expect(res.status).toBe(500);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});
