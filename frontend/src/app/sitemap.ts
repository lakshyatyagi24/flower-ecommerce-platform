import type { MetadataRoute } from 'next';
import { listProducts } from '@/lib/server-api';
import { absoluteUrl } from '@/lib/seo';

// R1: the API is not reachable during `next build`, so this is never prerendered.
export const dynamic = 'force-dynamic';

const STATIC_PATHS = ['/', '/products', '/about', '/contact', '/corporate', '/faq', '/privacy', '/terms', '/refund-policy'];
const PAGE_SIZE = 200;
const MAX_PAGES = 50; // hard stop: 50 x 200 = 10,000 products
const MAX_URLS = 50000; // sitemap protocol limit per file

type Entry = MetadataRoute.Sitemap[number];

/**
 * Sitemap protocol allows 50,000 URLs per file. We cannot reach that with MAX_PAGES x PAGE_SIZE
 * today, but if the caps are ever raised we truncate (loudly) rather than emit an invalid file.
 * Splitting into a sitemap index (generateSitemaps) is the follow-up if the catalogue gets that big.
 */
export function limitEntries<T>(entries: T[]): T[] {
  if (entries.length <= MAX_URLS) return entries;
  console.warn(`sitemap: ${entries.length} URLs exceeds the ${MAX_URLS} protocol limit; truncating`);
  return entries.slice(0, MAX_URLS);
}

function validDate(v: unknown): Date | undefined {
  if (typeof v !== 'string' && !(v instanceof Date)) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * NOTE: no try/catch on purpose. If the API fails the route must 5xx so crawlers retry;
 * a 200 with a partial list could make Google drop product URLs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = new Map<string, Entry>();
  for (const p of STATIC_PATHS) {
    const url = absoluteUrl(p);
    entries.set(url, { url });
  }

  let page = 1;
  let pages = 1;
  do {
    const res = await listProducts({ page, take: PAGE_SIZE });
    pages = res.pages;
    for (const p of res.items) {
      if (p.active === false) continue;
      const url = absoluteUrl(`/products/${p.slug}`);
      if (entries.has(url)) continue;
      const lastModified = validDate((p as { updatedAt?: unknown }).updatedAt);
      entries.set(url, lastModified ? { url, lastModified } : { url });
    }
    page += 1;
  } while (page <= pages && page <= MAX_PAGES);

  return limitEntries([...entries.values()]);
}
