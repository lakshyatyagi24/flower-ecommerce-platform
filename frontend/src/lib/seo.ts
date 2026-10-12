import type { ApiProduct } from './api';
import { productImage } from './product-image';

/** Canonical site origin, no trailing slash. */
export const SITE: string = (process.env.NEXT_PUBLIC_SITE_URL || 'https://freshpetalsindia.com').replace(/\/+$/, '');

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Plain-text meta description: no HTML or newlines, cut on a word boundary with an ellipsis. */
export function metaDescription(text: string | null | undefined, max = 155): string {
  const clean = (text ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= max) return clean;
  const room = clean.slice(0, max - 1);
  const lastSpace = room.lastIndexOf(' ');
  const cut = lastSpace > max * 0.5 ? room.slice(0, lastSpace) : room;
  return `${cut.replace(/[\s,;:.\-–—]+$/, '')}…`;
}

type JsonObject = Record<string, unknown>;

/**
 * schema.org Product. Availability is derived from stock for every sale mode:
 * stock > 0 -> InStock, otherwise OutOfStock (enquiry-only products included —
 * we do not claim PreOrder because we cannot promise a date).
 */
export function productJsonLd(p: ApiProduct): JsonObject {
  const ld: JsonObject = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: [absoluteUrl(productImage(p))],
    sku: p.slug,
    brand: { '@type': 'Brand', name: 'Fresh Petals India' },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/products/${p.slug}`),
      priceCurrency: 'INR',
      price: Number(p.price).toFixed(2),
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
  const desc = metaDescription(p.description, 5000);
  if (desc) ld.description = desc;
  if ((p.reviewCount ?? 0) > 0) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: (p.averageRating ?? 0).toFixed(1),
      reviewCount: p.reviewCount,
    };
  }
  return ld;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function itemListJsonLd(products: ApiProduct[]): JsonObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/products/${p.slug}`),
      name: p.name,
    })),
  };
}
