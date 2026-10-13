import 'server-only';
import * as React from 'react';
import type { ApiCategory, ApiProduct, ProductSort } from './api';
import { HERO_FALLBACK, pickHero, type HeroContent } from './hero';

/**
 * Server-side API access for Server Components (SSR). Never imported by client code.
 * Uses the internal API address when set (Docker network / loopback) so SSR does not
 * hairpin through the public domain. Responses go through the Next data cache.
 */
function base(): string {
  return (process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001').replace(/\/+$/, '');
}

export type ListParams = {
  category?: string;
  tag?: string;
  sort?: ProductSort;
  q?: string;
  page?: number;
  take?: number;
  featured?: boolean;
};

export type ProductPage = { items: ApiProduct[]; total: number; page: number; pages: number; take: number };

/**
 * Per-request memoisation. React's automatic fetch dedupe is skipped for requests that carry an abort
 * `signal`, so layout + page + generateMetadata would each hit the data cache separately. `cache()` keys on
 * the (primitive) arguments and lives for one render pass. It is a no-op outside the Next server runtime
 * (tests, scripts), where React 18 does not export it.
 */
type Memo = <A extends unknown[], R>(fn: (...a: A) => R) => (...a: A) => R;
const requestCache: Memo = (React as unknown as { cache?: Memo }).cache ?? ((fn) => fn);

const API_TIMEOUT_MS = 5000;

async function fetchJson<T>(path: string, revalidate: number, allow404: boolean): Promise<T | null> {
  // Timeout: a hung API must fail the call (callers degrade) rather than hang the page.
  const res = await fetch(`${base()}${path}`, { next: { revalidate }, signal: AbortSignal.timeout(API_TIMEOUT_MS) });
  if (allow404 && res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path.split('?')[0]} responded ${res.status}`);
  return (await res.json()) as T;
}

const memoGet = requestCache(fetchJson);

function get<T>(path: string, revalidate = 60, allow404 = false): Promise<T | null> {
  return memoGet(path, revalidate, allow404) as Promise<T | null>;
}

/** Returns null when the product does not exist; throws on any other failure. */
export async function getProduct(slug: string): Promise<ApiProduct | null> {
  return get<ApiProduct>(`/products/slug/${encodeURIComponent(slug)}`, 60, true);
}

export async function listProducts(params: ListParams = {}): Promise<ProductPage> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    qs.set(k, String(v));
  }
  const suffix = qs.toString();
  const res = (await get<{ items: ApiProduct[]; total: number; page?: number; pages?: number; take?: number }>(
    `/products${suffix ? `?${suffix}` : ''}`,
  ))!;
  return {
    items: res.items,
    total: res.total,
    page: res.page ?? 1,
    pages: res.pages ?? 1,
    take: res.take ?? params.take ?? res.items.length,
  };
}

export async function listCategories(): Promise<ApiCategory[]> {
  return (await get<ApiCategory[]>('/categories'))!;
}

export async function getSettings(): Promise<Record<string, string>> {
  return (await get<Record<string, string>>('/settings', 300))!;
}

const LAYOUT_SETTINGS_CAP_MS = 2500;

/**
 * Settings for the root layout (announcement bar, footer contact). Never throws and gives up after 2.5 s,
 * because every page render waits on it: null means "unavailable", and the client provider then loads the
 * settings itself after mount. Shares the memoised `getSettings()` request (same cache entry as the PDP), so
 * one render makes one settings call; the cap only bounds how long the layout waits for it.
 */
export async function getLayoutSettings(): Promise<Record<string, string> | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      getSettings(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('layout settings timed out')), LAYOUT_SETTINGS_CAP_MS);
      }),
    ]);
  } catch (err) {
    console.warn('[layout] settings fetch failed, client will load them', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Hero content for the home page. Never throws: any API failure yields the static fallback,
 * so the hero renders even when the API is down.
 */
export async function getHeroSlide(): Promise<HeroContent> {
  try {
    return pickHero(await get<unknown>('/sliders'));
  } catch (err) {
    console.error('[home] hero slider fetch failed, using static hero', err);
    return HERO_FALLBACK;
  }
}
