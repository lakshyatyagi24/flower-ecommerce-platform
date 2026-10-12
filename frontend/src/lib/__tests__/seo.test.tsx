/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { absoluteUrl, SITE, productJsonLd, breadcrumbJsonLd, itemListJsonLd, metaDescription } from '../seo';
import JsonLd from '../../components/JsonLd';
import type { ApiProduct } from '../api';

const base: ApiProduct = {
  id: 1, name: 'Red Rose', slug: 'red-rose', description: 'Lovely roses.', price: 499, image: null,
  stock: 5, featured: false, active: true, categoryId: 1, reviewCount: 0, averageRating: 0,
};

describe('absoluteUrl / SITE', () => {
  it('defaults to the production domain without trailing slash', () => {
    expect(SITE).toBe('https://freshpetalsindia.com');
    expect(absoluteUrl('/products/x')).toBe('https://freshpetalsindia.com/products/x');
    expect(absoluteUrl('products/x')).toBe('https://freshpetalsindia.com/products/x');
  });
  it('leaves absolute URLs alone', () => {
    expect(absoluteUrl('https://res.cloudinary.com/a.jpg')).toBe('https://res.cloudinary.com/a.jpg');
  });
});

describe('productJsonLd', () => {
  it('builds a Product with absolute image, offer and no rating without reviews', () => {
    const j = productJsonLd(base) as any;
    expect(j['@context']).toBe('https://schema.org');
    expect(j['@type']).toBe('Product');
    expect(j.name).toBe('Red Rose');
    expect(j.image).toEqual(['https://freshpetalsindia.com/images/placeholder-bloom.jpg']);
    expect(j.sku).toBe('red-rose');
    expect(j.brand).toEqual({ '@type': 'Brand', name: 'Fresh Petals India' });
    expect(j.offers).toMatchObject({
      '@type': 'Offer', url: 'https://freshpetalsindia.com/products/red-rose', priceCurrency: 'INR',
      price: '499.00', availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition',
    });
    expect(j.aggregateRating).toBeUndefined();
  });
  it('uses the cloudinary image as-is', () => {
    const j = productJsonLd({ ...base, image: 'https://res.cloudinary.com/x/a.jpg' }) as any;
    expect(j.image).toEqual(['https://res.cloudinary.com/x/a.jpg']);
  });
  it('is OutOfStock at zero stock or stock below the minimum order', () => {
    expect((productJsonLd({ ...base, stock: 0 }) as any).offers.availability).toBe('https://schema.org/OutOfStock');
    expect((productJsonLd({ ...base, stock: 3, minOrderQty: 5 }) as any).offers.availability).toBe('https://schema.org/OutOfStock');
  });
  it('omits offers for enquiry products (no price is published)', () => {
    const j = productJsonLd({ ...base, saleMode: 'ENQUIRY', reviewCount: 2, averageRating: 4 }) as any;
    expect(j.offers).toBeUndefined();
    expect(j.aggregateRating.reviewCount).toBe(2);
  });
  it('returns null for an enquiry product with neither offers nor ratings', () => {
    expect(productJsonLd({ ...base, saleMode: 'ENQUIRY' })).toBeNull();
  });
  it('uses the clean lead paragraph, not label lines, as description', () => {
    const j = productJsonLd({ ...base, description: 'What you get\n\nTwelve roses.' }) as any;
    expect(j.description).toBe('Twelve roses.');
  });
  it('adds aggregateRating only when reviews exist', () => {
    const j = productJsonLd({ ...base, reviewCount: 3, averageRating: 4.666 }) as any;
    expect(j.aggregateRating).toEqual({ '@type': 'AggregateRating', ratingValue: '4.7', reviewCount: 3 });
  });
  it('omits description when empty', () => {
    expect((productJsonLd({ ...base, description: null }) as any).description).toBeUndefined();
  });
});

describe('breadcrumbJsonLd / itemListJsonLd', () => {
  it('numbers items and absolutises urls', () => {
    const j = breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Roses', path: '/products?category=roses' }]) as any;
    expect(j['@type']).toBe('BreadcrumbList');
    expect(j.itemListElement[1]).toEqual({
      '@type': 'ListItem', position: 2, name: 'Roses', item: 'https://freshpetalsindia.com/products?category=roses',
    });
  });
  it('lists products with positions and urls', () => {
    const j = itemListJsonLd([base, { ...base, id: 2, slug: 'b', name: 'B' }]) as any;
    expect(j['@type']).toBe('ItemList');
    expect(j.itemListElement).toHaveLength(2);
    expect(j.itemListElement[1]).toMatchObject({ '@type': 'ListItem', position: 2, url: 'https://freshpetalsindia.com/products/b', name: 'B' });
  });
});

describe('JsonLd component', () => {
  it('escapes < so product text cannot close the script tag', () => {
    const data = productJsonLd({ ...base, name: 'Evil </script><script>alert(1)</script>' });
    const { container } = render(<JsonLd data={data} />);
    const s = container.querySelector('script[type="application/ld+json"]')!;
    expect(s.innerHTML).not.toContain('</script>');
    expect(s.innerHTML).toContain('\\u003c/script>');
    expect(JSON.parse(s.textContent!).name).toBe('Evil </script><script>alert(1)</script>');
  });
});

describe('metaDescription', () => {
  it('strips html, collapses whitespace', () => {
    expect(metaDescription('<p>Hello\n\n  <b>world</b></p>')).toBe('Hello world');
  });
  it('truncates at a word boundary with an ellipsis', () => {
    const out = metaDescription('word '.repeat(60), 20);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/wor…$/);
  });
  it('returns short text untouched and handles null', () => {
    expect(metaDescription('Short.')).toBe('Short.');
    expect(metaDescription(null)).toBe('');
  });
});

import { organizationJsonLd, websiteJsonLd, faqJsonLd } from '../seo';

describe('organizationJsonLd / websiteJsonLd / faqJsonLd', () => {
  it('Organization has name, url and an absolute logo', () => {
    const j = organizationJsonLd() as any;
    expect(j['@context']).toBe('https://schema.org');
    expect(j['@type']).toBe('Organization');
    expect(j.name).toBe('Fresh Petals India');
    expect(j.url).toBe(SITE);
    expect(j.logo).toBe(`${SITE}/logo.png`);
  });
  it('WebSite exposes a SearchAction targeting /products?q=', () => {
    const j = websiteJsonLd() as any;
    expect(j['@type']).toBe('WebSite');
    expect(j.url).toBe(SITE);
    expect(j.potentialAction['@type']).toBe('SearchAction');
    expect(j.potentialAction.target).toBe(`${SITE}/products?q={search_term_string}`);
    expect(j.potentialAction['query-input']).toBe('required name=search_term_string');
  });
  it('FAQPage maps questions to Question/Answer', () => {
    const j = faqJsonLd([{ q: 'Q1?', a: 'A1.' }, { q: 'Q2?', a: 'A2.' }]) as any;
    expect(j['@type']).toBe('FAQPage');
    expect(j.mainEntity).toHaveLength(2);
    expect(j.mainEntity[0]).toEqual({ '@type': 'Question', name: 'Q1?', acceptedAnswer: { '@type': 'Answer', text: 'A1.' } });
  });
});
