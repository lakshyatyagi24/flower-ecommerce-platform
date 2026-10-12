import { describe, it, expect } from 'vitest';
import { shownCategories, flattenActive, collectionTitle, hasProducts } from '../categories';

const c = (slug: string, productCount?: number, extra: Record<string, unknown> = {}) => ({ id: slug.length, name: slug, slug, productCount, ...extra }) as any;

describe('shownCategories', () => {
  it('hides empty and inactive categories, keeps unknown counts', () => {
    const out = shownCategories([c('a', 3), c('b', 0), c('c'), c('d', 5, { active: false })]);
    expect(out.map((x) => x.slug)).toEqual(['a', 'c']);
  });
  it('keeps a parent with no own products when a child has some, and filters empty children', () => {
    const out = shownCategories([c('p', 0, { children: [c('x', 0), c('y', 2)] })]);
    expect(out).toHaveLength(1);
    expect(out[0].children!.map((x: any) => x.slug)).toEqual(['y']);
    expect(hasProducts(c('q', 0, { children: [c('z', 0)] }))).toBe(false);
  });
});

describe('flattenActive', () => {
  it('drops children of inactive parents', () => {
    const out = flattenActive([c('a', 1, { children: [c('a1', 1)] }), c('b', 1, { active: false, children: [c('b1', 1)] })]);
    expect(out.map((x) => x.slug)).toEqual(['a', 'a1']);
  });
});

describe('collectionTitle', () => {
  it('uses Buy for purchasable and Enquire for enquiry-only categories', () => {
    expect(collectionTitle({ name: 'Cut Flowers', defaultSaleMode: 'PURCHASE' })).toBe('Cut Flowers — Buy Fresh Flowers Online');
    expect(collectionTitle({ name: 'Hampers', defaultSaleMode: 'ENQUIRY' })).toBe('Hampers — Enquire Online');
    expect(collectionTitle({ name: 'Plants' })).toBe('Plants — Buy Fresh Flowers Online');
  });
  it('never exceeds 60 characters with the brand suffix, falling back to the bare name', () => {
    const t = collectionTitle({ name: 'Extraordinarily Long Category Name', defaultSaleMode: 'PURCHASE' });
    expect(t).toBe('Extraordinarily Long Category Name');
    expect(collectionTitle({ name: 'Corporate Bouquets', defaultSaleMode: 'ENQUIRY' }).length + 21).toBeLessThanOrEqual(60);
  });
});
