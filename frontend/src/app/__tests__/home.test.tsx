import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiProduct } from '@/lib/api';
import { HERO_FALLBACK } from '@/lib/hero';

const listProducts = vi.fn();
const getSettings = vi.fn();
const getHeroSlide = vi.fn();
vi.mock('@/lib/server-api', () => ({
  listProducts: (...a: unknown[]) => listProducts(...a),
  getSettings: (...a: unknown[]) => getSettings(...a),
  getHeroSlide: (...a: unknown[]) => getHeroSlide(...a),
}));
vi.mock('@/lib/cart-context', () => ({ useCart: () => ({ add: vi.fn() }) }));
vi.mock('@/lib/api', async (orig) => ({ ...(await orig<typeof import('@/lib/api')>()), api: { subscribeNewsletter: vi.fn() } }));

import Home from '../page';

const mk = (id: number, name: string, featured = false): ApiProduct => ({
  id, name, slug: `p-${id}`, description: null, price: 100 * id, image: null,
  stock: 5, featured, active: true, categoryId: 1, saleMode: 'PURCHASE',
});
const page = (items: ApiProduct[]) => ({ items, total: items.length, page: 1, pages: 1, take: 8 });

async function renderHome() {
  const ui = await Home();
  return render(ui);
}
const names = (n: string) => screen.queryAllByRole('heading', { level: 3, name: n });
const headingTexts = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

describe('Home page', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getHeroSlide.mockReset().mockResolvedValue(HERO_FALLBACK);
    getSettings.mockReset().mockResolvedValue({});
    listProducts.mockReset().mockImplementation(async (p: { featured?: boolean }) =>
      p.featured ? page([mk(1, 'Red Rose', true), mk(2, 'Pink Peony', true)]) : page([mk(2, 'Pink Peony'), mk(3, 'White Lily'), mk(4, 'Blue Iris')]),
    );
  });

  it('has exactly one h1, in the hero', async () => {
    await renderHome();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe('Fresh flowers, arranged with care.');
    expect(screen.getByRole('link', { name: 'Shop flowers' }).getAttribute('href')).toBe('/products');
  });

  it('renders the sections in order', async () => {
    await renderHome();
    expect(headingTexts()).toEqual(['Our favourites', 'Shop by occasion', 'Flowers for work and for gatherings', 'Just in', 'Notes from the studio']);
  });

  it('requests 8 featured products and 8+ newest, and does not repeat featured items in New arrivals', async () => {
    await renderHome();
    expect(listProducts).toHaveBeenCalledWith({ featured: true, take: 8 });
    expect(listProducts).toHaveBeenCalledWith(expect.objectContaining({ sort: 'newest' }));
    // Pink Peony is featured, so it appears once (in Our favourites) and not again under Just in.
    expect(names('Pink Peony')).toHaveLength(1);
    expect(names('White Lily')).toHaveLength(1);
  });

  it('falls back to the newest products when none are featured', async () => {
    listProducts.mockImplementation(async (p: { featured?: boolean }) =>
      p.featured ? page([]) : page([mk(3, 'White Lily'), mk(4, 'Blue Iris')]),
    );
    await renderHome();
    expect(names('White Lily')).toHaveLength(1);
    expect(screen.queryByRole('heading', { name: 'Our favourites' })).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'From the shop' })).toBeInTheDocument();
  });

  it('links the four occasion tiles', async () => {
    await renderHome();
    for (const [name, slug] of [['Birthday', 'birthday'], ['Anniversary', 'anniversary'], ['Wedding', 'wedding'], ['Just because', 'just-because']]) {
      const link = screen.getByRole('link', { name: new RegExp(`Flowers for\\s*${name}`, 'i') });
      expect(link.getAttribute('href')).toBe(`/occasions/${slug}`);
    }
    expect(screen.getByRole('link', { name: /corporate enquiries/i }).getAttribute('href')).toBe('/corporate');
  });

  it('renders the USP fallback without delivery claims, and settings USPs when present', async () => {
    const { unmount } = await renderHome();
    expect(screen.getByText('Hand-tied by our florists')).toBeInTheDocument();
    unmount();
    getSettings.mockResolvedValue({ 'trust.usp1Title': 'Packed with care', 'trust.usp2Title': 'Quoted for events' });
    await renderHome();
    expect(screen.getByText('Packed with care')).toBeInTheDocument();
    expect(screen.getByText('Quoted for events')).toBeInTheDocument();
  });

  it('still renders hero and static sections (and does not throw) when every data call fails', async () => {
    getSettings.mockRejectedValue(new Error('down'));
    listProducts.mockRejectedValue(new Error('down'));
    getHeroSlide.mockResolvedValue(HERO_FALLBACK); // getHeroSlide itself never throws
    await renderHome();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Hand-tied by our florists')).toBeInTheDocument();
    expect(headingTexts()).toEqual(['Shop by occasion', 'Flowers for work and for gatherings', 'Notes from the studio']);
    expect(console.error).toHaveBeenCalled();
  });

  it('shows the section whose call succeeded when only the other fails', async () => {
    listProducts.mockImplementation(async (p: { featured?: boolean }) => {
      if (p.featured) throw new Error('boom');
      return page([mk(3, 'White Lily')]);
    });
    await renderHome();
    // featured failed: the section falls back to the newest products, and the page still renders.
    expect(names('White Lily')).toHaveLength(1);
  });

  it('has no testimonials, ratings or invented claims', async () => {
    const { container } = await renderHome();
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/testimonial|customers say|happy customers|reviews?\b|★|same-day|free delivery|8\+|1000\+|award/i);
    expect(container.querySelectorAll('img[src*="person"]')).toHaveLength(0);
  });
});
