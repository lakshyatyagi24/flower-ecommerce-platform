import type { ApiProduct } from './api';
import { productImage } from './product-image';
import { availability } from './product-helpers';
import { PLACEHOLDER_IMAGE } from './product-image';

/** Canonical site origin, no trailing slash. */
export const SITE: string = (process.env.NEXT_PUBLIC_SITE_URL || 'https://freshpetalsindia.com').replace(/\/+$/, '');

export const OG_DEFAULT_ALT = 'Fresh Petals India: fresh flowers, delivered';

/**
 * openGraph + twitter blocks for pages that define their own `openGraph` (which replaces the parent's wholesale
 * in Next, so image, site name and locale must be repeated). Uses the static brand cards.
 */
export function socialMeta(title: string, description: string, url: string) {
  return {
    openGraph: {
      title,
      description,
      url,
      type: 'website' as const,
      siteName: 'Fresh Petals India',
      locale: 'en_IN',
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: OG_DEFAULT_ALT }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [{ url: '/twitter-image.png', width: 1200, height: 630, alt: OG_DEFAULT_ALT }],
    },
  };
}

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
 * schema.org Product, or null when there is nothing rich to say.
 * - PURCHASE products get an Offer (InStock / OutOfStock from availability()).
 * - ENQUIRY products get NO Offer (the page says "Price on enquiry"; we must not publish a price).
 * - A Product with neither offers nor aggregateRating is invalid for rich results, so null.
 */
/**
 * Description for meta tags and structured data, built ONLY from structured facts (name, category, price,
 * unit, optional delivery city). Never from product.description: that text is imported copy that has not been
 * vetted and can carry unverifiable claims or duplicate other sites.
 */
export function productFactsDescription(
  p: Pick<ApiProduct, 'name' | 'price' | 'unit' | 'saleMode'> & { category?: { name: string } | null },
  opts: { city?: string | null } = {},
): string {
  const unit = p.unit && p.unit !== 'piece' ? ` per ${p.unit}` : '';
  const price = p.saleMode === 'ENQUIRY' ? 'Price on enquiry.' : `Priced at ₹${Number(p.price).toLocaleString('en-IN')}${unit}.`;
  const cat = p.category?.name ? ` in ${p.category.name}` : '';
  const city = opts.city?.trim() ? ` Order online for delivery in ${opts.city.trim()}.` : ' Order online.';
  return `${p.name}${cat} from Fresh Petals India. ${price}${city}`;
}

export function productJsonLd(p: ApiProduct, opts: { city?: string | null } = {}): JsonObject | null {
  const ld: JsonObject = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.slug,
    brand: { '@type': 'Brand', name: 'Fresh Petals India' },
  };
  // No photo: omit `image` rather than advertise the placeholder as the product's picture.
  const img = productImage(p);
  if (img !== PLACEHOLDER_IMAGE) ld.image = [absoluteUrl(img)];
  ld.description = productFactsDescription(p, opts);
  if (p.saleMode !== 'ENQUIRY') {
    ld.offers = {
      '@type': 'Offer',
      url: absoluteUrl(`/products/${p.slug}`),
      priceCurrency: 'INR',
      price: Number(p.price).toFixed(2),
      availability: availability(p) === 'in-stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    };
  }
  if ((p.reviewCount ?? 0) > 0) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: (p.averageRating ?? 0).toFixed(1),
      reviewCount: p.reviewCount,
    };
  }
  return ld.offers || ld.aggregateRating ? ld : null;
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

export function organizationJsonLd(): JsonObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fresh Petals India',
    url: SITE,
    logo: absoluteUrl('/logo.png'),
  };
}

export function websiteJsonLd(): JsonObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Fresh Petals India',
    url: SITE,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE}/products?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function faqJsonLd(items: { q: string; a: string }[]): JsonObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}
