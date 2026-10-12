import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiProduct } from '@/lib/api';

const getProduct = vi.fn();
const listProducts = vi.fn();
const getSettings = vi.fn();
vi.mock('@/lib/server-api', () => ({
  getProduct: (...a: unknown[]) => getProduct(...a),
  listProducts: (...a: unknown[]) => listProducts(...a),
  getSettings: (...a: unknown[]) => getSettings(...a),
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/cart-context', () => ({ useCart: () => ({ add: vi.fn() }) }));
vi.mock('@/components/ProductReviews', () => ({ default: () => <div data-testid="reviews" /> }));
vi.mock('@/components/EnquiryModal', () => ({ default: () => null }));

import ProductPage, { generateMetadata } from '../[slug]/page';

const product: ApiProduct = {
  id: 1, name: 'Red Rose', slug: 'red-rose', description: 'First paragraph.\n\nSecond paragraph.', price: 499,
  image: null, stock: 12, featured: false, active: true, categoryId: 2, unit: 'stem', minOrderQty: 1,
  category: { id: 2, name: 'Roses', slug: 'roses' }, reviewCount: 2, averageRating: 4.5, saleMode: 'PURCHASE',
};

function ld(container: HTMLElement) {
  return [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!));
}

describe('product detail page', () => {
  beforeEach(() => {
    getProduct.mockReset().mockResolvedValue(product);
    listProducts.mockReset().mockResolvedValue({
      items: [product, { ...product, id: 2, slug: 'pink-rose', name: 'Pink Rose' }],
      total: 2, page: 1, pages: 1, take: 5,
    });
    getSettings.mockReset().mockResolvedValue({ 'trust.usp1Title': 'Freshness guarantee', 'trust.usp1Body': 'Cut to order.', 'policies.deliverySummary': 'We deliver 9 to 6.' });
  });

  it('renders the h1, price with unit, breadcrumbs, admin-managed reassurance points and related products without the current one', async () => {
    const { container } = render(await ProductPage({ params: { slug: 'red-rose' } }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Red Rose');
    expect(container.textContent).toContain('₹499');
    expect(container.textContent).toContain('/ stem');
    expect(container.textContent).toContain('Freshness guarantee');
    expect(container.textContent).toContain('Cut to order.');
    expect(container.textContent).toContain('We deliver 9 to 6.');
    expect(container.textContent).not.toMatch(/same-day/i);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /add to bag/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /pink rose/i }).getAttribute('href')).toBe('/products/pink-rose');
    expect(screen.queryAllByRole('link', { name: /^red rose$/i }).length).toBe(0);
    expect(listProducts).toHaveBeenCalledWith({ category: 'roses', take: 5 });
  });

  it('emits Product and BreadcrumbList JSON-LD', async () => {
    const { container } = render(await ProductPage({ params: { slug: 'red-rose' } }));
    const data = ld(container);
    const p = data.find((d) => d['@type'] === 'Product');
    expect(p.name).toBe('Red Rose');
    expect(p.offers.price).toBe('499.00');
    expect(p.aggregateRating.reviewCount).toBe(2);
    expect(data.find((d) => d['@type'] === 'BreadcrumbList').itemListElement).toHaveLength(3);
  });

  it('still renders when settings and related products fail', async () => {
    getSettings.mockRejectedValue(new Error('down'));
    listProducts.mockRejectedValue(new Error('down'));
    const { container } = render(await ProductPage({ params: { slug: 'red-rose' } }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Red Rose');
    expect(container.textContent).toContain('Hand-tied by our florists');
    expect(container.textContent).not.toMatch(/same-day/i);
  });

  it('skips label lines when choosing the lead paragraph and renders them as headings in Details', async () => {
    getProduct.mockResolvedValue({ ...product, description: 'What you get\n\nA bunch of twelve fresh roses.\n\nSize it right\n\nFits a medium vase.' });
    const { container } = render(await ProductPage({ params: { slug: 'red-rose' } }));
    const lead = container.querySelector('h1')!.parentElement!.querySelector('p.mt-6')!;
    expect(lead.textContent).toBe('A bunch of twelve fresh roses.');
    expect(screen.getByText('What you get').tagName).toBe('P');
    // no heading level jumps: h1, then h2s only
    expect([...container.querySelectorAll('h1,h2,h3,h4')].map((h) => h.tagName)).not.toContain('H4');
    expect(screen.getByText('Fits a medium vase.')).toBeTruthy();
  });

  it('omits the Product JSON-LD for unrated enquiry products but keeps the breadcrumb', async () => {
    getProduct.mockResolvedValue({ ...product, saleMode: 'ENQUIRY', reviewCount: 0 });
    const { container } = render(await ProductPage({ params: { slug: 'red-rose' } }));
    const types = ld(container).map((d) => d['@type']);
    expect(types).toEqual(['BreadcrumbList']);
    expect(container.textContent).toContain('Price on enquiry');
  });

  it('keeps a priceless Product block for rated enquiry products', async () => {
    getProduct.mockResolvedValue({ ...product, saleMode: 'ENQUIRY' });
    const { container } = render(await ProductPage({ params: { slug: 'red-rose' } }));
    const p = ld(container).find((d) => d['@type'] === 'Product');
    expect(p.offers).toBeUndefined();
    expect(p.aggregateRating.reviewCount).toBe(2);
  });

  it('uses care copy for the product type', async () => {
    getProduct.mockResolvedValue({ ...product, productType: 'PLANT' });
    const { container } = render(await ProductPage({ params: { slug: 'red-rose' } }));
    expect(container.textContent).toMatch(/indirect light/i);
  });

  it('shows Enquire for enquiry products', async () => {
    getProduct.mockResolvedValue({ ...product, saleMode: 'ENQUIRY' });
    render(await ProductPage({ params: { slug: 'red-rose' } }));
    expect(screen.getByRole('button', { name: /^enquire$/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /add to bag/i })).toBeNull();
  });

  it('404s for missing and inactive products', async () => {
    getProduct.mockResolvedValue(null);
    await expect(ProductPage({ params: { slug: 'nope' } })).rejects.toThrow('NEXT_NOT_FOUND');
    getProduct.mockResolvedValue({ ...product, active: false });
    await expect(ProductPage({ params: { slug: 'red-rose' } })).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('propagates API outages (so error.tsx renders)', async () => {
    getProduct.mockRejectedValue(new Error('API down'));
    await expect(ProductPage({ params: { slug: 'red-rose' } })).rejects.toThrow('API down');
  });
});

describe('generateMetadata', () => {
  beforeEach(() => getProduct.mockReset().mockResolvedValue(product));

  it('builds title, description, canonical and twitter card (no explicit images)', async () => {
    const m = await generateMetadata({ params: { slug: 'red-rose' } });
    expect(m.title).toBe('Red Rose — Fresh Cut Flowers');
    expect(m.description).toBe('First paragraph.');
    expect(m.alternates?.canonical).toBe('/products/red-rose');
    // Placeholder-only product: images come from the file-based opengraph-image/twitter-image routes.
    expect((m.openGraph as { images?: unknown }).images).toBeUndefined();
    expect((m.twitter as { images?: unknown }).images).toBeUndefined();
    expect((m.twitter as { card: string }).card).toBe('summary_large_image');
  });

  it('uses an explicit Cloudinary JPEG 1200x630 for og and twitter when the product has a real photo', async () => {
    getProduct.mockResolvedValue({ ...product, image: 'https://res.cloudinary.com/demo/image/upload/v1/rose.jpg' });
    const m = await generateMetadata({ params: { slug: 'red-rose' } });
    const url = 'https://res.cloudinary.com/demo/image/upload/c_fill,w_1200,h_630,g_auto,f_jpg,q_auto/v1/rose.jpg';
    expect((m.openGraph as any).images).toEqual([{ url, width: 1200, height: 630, alt: 'Red Rose' }]);
    expect((m.twitter as any).images).toEqual([url]);
  });

  it('404s (before streaming, so the HTTP status is a real 404) for missing or inactive products', async () => {
    getProduct.mockResolvedValue(null);
    await expect(generateMetadata({ params: { slug: 'x' } })).rejects.toThrow('NEXT_NOT_FOUND');
    getProduct.mockResolvedValue({ ...product, active: false });
    await expect(generateMetadata({ params: { slug: 'x' } })).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('uses the clean lead paragraph (not seed label lines) for description, og and twitter', async () => {
    getProduct.mockResolvedValue({ ...product, description: 'What you get\n\nTwelve fresh roses.\n\nSize it right\n\nFits a vase.' });
    const m = await generateMetadata({ params: { slug: 'x' } });
    expect(m.description).toBe('Twelve fresh roses.');
    expect(m.openGraph?.description).toBe('Twelve fresh roses.');
    expect(m.twitter?.description).toBe('Twelve fresh roses.');
  });

  it('uses a type-appropriate title suffix', async () => {
    getProduct.mockResolvedValue({ ...product, productType: 'PLANT' });
    expect((await generateMetadata({ params: { slug: 'x' } })).title).toBe('Red Rose — Indoor Plants');
  });
});
