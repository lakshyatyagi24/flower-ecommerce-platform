import { ApiError, api, type ApiProduct } from './api';

type Line = { productId: number; slug: string };

export type FreshResult = {
  /** Products that exist, as the API returns them right now. */
  fresh: ApiProduct[];
  /** Lines whose product could not be checked (network/server error). Not the same as "gone". */
  unverified: number[];
  /** True when at least one request failed with something other than 404. */
  failed: boolean;
};

export type FetchOptions = {
  /** Parallel requests. Default 3. */
  concurrency?: number;
  /** Reuse an answer fetched at most this long ago. 0 always asks the server. Default 15s. */
  maxAgeMs?: number;
  getProduct?: (slug: string) => Promise<ApiProduct>;
};

const cache = new Map<string, { at: number; product: ApiProduct }>();

/** Test hook. */
export function clearFreshProductCache(): void {
  cache.clear();
}

/**
 * Fetches current data for the products in the bag. Each slug is requested once even if several lines share it,
 * at most `concurrency` requests run at a time, a 404 means the product is gone (simply absent from `fresh`)
 * and any other failure is reported as unverified instead of throwing - callers decide whether that blocks.
 */
export async function fetchFreshProducts(lines: readonly Line[], options: FetchOptions = {}): Promise<FreshResult> {
  const { concurrency = 3, maxAgeMs = 15_000, getProduct = (s: string) => api.getProductBySlug(s) } = options;
  const slugs = Array.from(new Set(lines.map((l) => l.slug)));
  const results = new Map<string, ApiProduct | 'gone' | 'failed'>();
  const now = Date.now();
  const todo: string[] = [];
  for (const slug of slugs) {
    const hit = cache.get(slug);
    if (hit && maxAgeMs > 0 && now - hit.at < maxAgeMs) results.set(slug, hit.product);
    else todo.push(slug);
  }

  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const slug = todo[next++];
      try {
        const product = await getProduct(slug);
        cache.set(slug, { at: Date.now(), product });
        results.set(slug, product);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          cache.delete(slug);
          results.set(slug, 'gone');
        } else {
          results.set(slug, 'failed');
        }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), todo.length) }, worker));

  const fresh: ApiProduct[] = [];
  const unverified: number[] = [];
  for (const slug of slugs) {
    const r = results.get(slug);
    if (r && r !== 'gone' && r !== 'failed') fresh.push(r);
  }
  for (const l of lines) if (results.get(l.slug) === 'failed') unverified.push(l.productId);
  return { fresh, unverified, failed: unverified.length > 0 };
}
