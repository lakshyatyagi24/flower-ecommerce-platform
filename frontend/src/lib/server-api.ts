import 'server-only';
import type { ApiCategory, ApiProduct, ProductSort } from './api';

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

async function get<T>(path: string, revalidate = 60, allow404 = false): Promise<T | null> {
  const res = await fetch(`${base()}${path}`, { next: { revalidate } });
  if (allow404 && res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path.split('?')[0]} responded ${res.status}`);
  return (await res.json()) as T;
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
