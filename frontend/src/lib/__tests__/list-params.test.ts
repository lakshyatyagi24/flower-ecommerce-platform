import { describe, it, expect } from 'vitest';
import { parseListParams, listHref } from '../list-params';
import { pageWindow } from '../pagination';

describe('parseListParams', () => {
  it('returns defaults for no params', () => {
    expect(parseListParams({})).toEqual({ page: 1 });
    expect(parseListParams(undefined)).toEqual({ page: 1 });
  });

  it('accepts valid values', () => {
    expect(parseListParams({ category: 'roses', tag: 'birthday', sort: 'price_asc', page: '3', q: ' red rose ' })).toEqual({
      category: 'roses', tag: 'birthday', sort: 'price_asc', page: 3, q: 'red rose',
    });
  });

  it('treats the legacy collection param as category', () => {
    expect(parseListParams({ collection: 'plants' }).category).toBe('plants');
    expect(parseListParams({ collection: 'plants', category: 'roses' }).category).toBe('roses');
  });

  it('falls back to page 1 for garbage pages', () => {
    for (const bad of ['-1', 'abc', '0', '1.5', '1e20', '', '99999999999999999999', ' ']) {
      expect(parseListParams({ page: bad }).page).toBe(1);
    }
  });

  it('drops unknown sorts', () => {
    expect(parseListParams({ sort: 'evil' }).sort).toBeUndefined();
    expect(parseListParams({ sort: 'price-asc' }).sort).toBeUndefined();
    expect(parseListParams({ sort: 'newest' }).sort).toBe('newest');
  });

  it('drops slugs with unsafe characters and caps lengths', () => {
    expect(parseListParams({ category: '../etc/passwd' }).category).toBeUndefined();
    expect(parseListParams({ category: 'a'.repeat(200) }).category).toBeUndefined();
    expect(parseListParams({ q: 'x'.repeat(5000) }).q).toHaveLength(100);
    expect(parseListParams({ q: '   ' }).q).toBeUndefined();
  });

  it('uses the first value of repeated params and ignores non-strings', () => {
    expect(parseListParams({ category: ['roses', 'lilies'] }).category).toBe('roses');
    expect(parseListParams({ sort: ['evil', 'newest'] }).sort).toBeUndefined();
    expect(parseListParams({ page: [] as unknown as string[] }).page).toBe(1);
    expect(parseListParams({ q: undefined }).q).toBeUndefined();
  });
});

describe('listHref', () => {
  it('builds /products with only set values; page 1 is omitted', () => {
    expect(listHref({ page: 1 })).toBe('/products');
    expect(listHref({ category: 'roses', sort: 'popular', page: 2, q: 'a b' })).toBe(
      '/products?category=roses&sort=popular&q=a+b&page=2',
    );
  });
  it('applies overrides (and resets page when asked)', () => {
    expect(listHref({ category: 'roses', page: 3 }, { page: 4 })).toBe('/products?category=roses&page=4');
    expect(listHref({ category: 'roses', page: 3 }, { category: undefined, page: 1 })).toBe('/products');
    expect(listHref({ sort: 'popular', page: 3 }, { sort: 'price_asc', page: 1 })).toBe('/products?sort=price_asc');
  });
});

describe('pageWindow', () => {
  it('lists every page when few', () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
  });
  it('windows with ellipses around the current page', () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, 3, 'gap', 10]);
    expect(pageWindow(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10]);
    expect(pageWindow(10, 10)).toEqual([1, 'gap', 8, 9, 10]);
  });
  it('does not insert a gap for a single hidden page', () => {
    expect(pageWindow(4, 10)).toEqual([1, 2, 3, 4, 5, 'gap', 10]);
  });
  it('handles one or zero pages', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(1, 0)).toEqual([]);
  });
});
