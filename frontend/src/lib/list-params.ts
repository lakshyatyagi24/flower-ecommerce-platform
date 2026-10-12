import type { ProductSort } from './api';

export const SORTS: readonly ProductSort[] = ['newest', 'price_asc', 'price_desc', 'popular'];
export const PAGE_SIZE = 24;
const MAX_PAGE = 1000;
const SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;

export type ListParams = { category?: string; tag?: string; sort?: ProductSort; q?: string; page: number };
export type RawSearchParams = Record<string, string | string[] | undefined> | undefined | null;

function first(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === 'string' ? s : undefined;
}

/** Validates untrusted query-string input before it reaches the API. Garbage is ignored, never thrown on. */
export function parseListParams(sp: RawSearchParams): ListParams {
  const raw = sp ?? {};
  const out: ListParams = { page: 1 };

  const slug = (v: string | string[] | undefined) => {
    const s = first(v)?.trim();
    return s && SLUG.test(s) ? s : undefined;
  };
  const category = slug(raw.category) ?? slug(raw.collection);
  if (category) out.category = category;
  const tag = slug(raw.tag);
  if (tag) out.tag = tag;

  const sort = first(raw.sort)?.trim();
  if (sort && (SORTS as readonly string[]).includes(sort)) out.sort = sort as ProductSort;

  const q = first(raw.q)?.trim().slice(0, 100).trim();
  if (q) out.q = q;

  const page = first(raw.page)?.trim();
  if (page && /^\d{1,4}$/.test(page)) {
    const n = Number(page);
    if (n >= 1 && n <= MAX_PAGE) out.page = n;
  }
  return out;
}

/**
 * Listing URL for a parsed param set with optional overrides (an explicit undefined removes a key).
 * `basePath` is the page's own path (/products, /collections/roses, /occasions/birthday) so sort and
 * pagination links stay on the page they were rendered on.
 */
export function listHref(params: ListParams, overrides: Partial<ListParams> = {}, basePath = '/products'): string {
  const p = { ...params, ...overrides };
  const qs = new URLSearchParams();
  if (p.category) qs.set('category', p.category);
  if (p.tag) qs.set('tag', p.tag);
  if (p.sort) qs.set('sort', p.sort);
  if (p.q) qs.set('q', p.q);
  if (p.page > 1) qs.set('page', String(p.page));
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}
