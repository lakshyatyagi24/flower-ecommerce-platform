import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/cart-context', () => ({
  useCart: () => ({ add: vi.fn(), open: vi.fn(), items: [] }),
  formatINR: (n: number) => `Rs ${n}`,
}));

import Hero from '@/components/home/Hero';
import CorporateSplit from '@/components/home/CorporateSplit';
import ProductGrid from '../ProductGrid';
import { HERO_FALLBACK } from '@/lib/hero';

const product = (id: number) =>
  ({ id, slug: `p-${id}`, name: `Product ${id}`, price: 100, image: 'https://res.cloudinary.com/x/image/upload/a.jpg', stock: 5, productType: 'CUT_FLOWER' }) as never;

/**
 * Core Web Vitals guard: only the true LCP candidates may be eager. Everything else must lazy-load, and every
 * image must carry `sizes` so the optimiser does not ship desktop-width files to phones.
 */
describe('image loading priorities', () => {
  it('the home hero image is the priority (LCP) image and has sizes', () => {
    const { container } = render(<Hero hero={HERO_FALLBACK} />);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('fetchpriority')).toBe('high');
    expect(img.getAttribute('loading')).not.toBe('lazy');
    expect(img.getAttribute('sizes')).toBeTruthy();
  });

  it('only the first N grid cards are priority; the rest are lazy', () => {
    const { container } = render(<ProductGrid products={[1, 2, 3, 4, 5, 6].map(product)} priorityCount={2} />);
    const imgs = [...container.querySelectorAll('img')];
    expect(imgs).toHaveLength(6);
    imgs.forEach((img, i) => {
      expect(img.getAttribute('sizes')).toBeTruthy();
      if (i < 2) expect(img.getAttribute('fetchpriority')).toBe('high');
      else {
        expect(img.getAttribute('fetchpriority')).toBeNull();
        expect(img.getAttribute('loading')).toBe('lazy');
      }
    });
  });

  it('with no priorityCount every card is lazy (below-the-fold sections)', () => {
    const { container } = render(<ProductGrid products={[1, 2, 3].map(product)} />);
    container.querySelectorAll('img').forEach((img) => {
      expect(img.getAttribute('fetchpriority')).toBeNull();
      expect(img.getAttribute('loading')).toBe('lazy');
    });
  });

  it('the below-the-fold corporate image is lazy with sizes', () => {
    const { container } = render(<CorporateSplit />);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('fetchpriority')).toBeNull();
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('sizes')).toBeTruthy();
  });
});
