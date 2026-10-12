import { describe, it, expect } from 'vitest';
import { pickHero, HERO_FALLBACK, safeHref } from '../hero';

const good = {
  id: 1,
  title: 'Spring in bloom',
  eyebrow: 'New season',
  subtitle: 'Peonies are here.',
  alt: 'Peonies in a vase',
  image: 'https://res.cloudinary.com/demo/image/upload/v1/peonies.jpg',
  href: '/collections/cut-flowers',
  active: true,
};

describe('pickHero', () => {
  it('uses the first valid active slider', () => {
    const h = pickHero([good]);
    expect(h.source).toBe('slider');
    expect(h).toMatchObject({
      title: 'Spring in bloom',
      eyebrow: 'New season',
      subtitle: 'Peonies are here.',
      image: good.image,
      alt: 'Peonies in a vase',
      href: '/collections/cut-flowers',
    });
  });

  it('skips sliders without a Cloudinary image or without a title', () => {
    const h = pickHero([
      { ...good, id: 1, image: 'https://example.com/a.jpg' },
      { ...good, id: 2, title: '  ' },
      { ...good, id: 3, active: false },
      { ...good, id: 4, title: 'Fourth' },
    ]);
    expect(h.title).toBe('Fourth');
  });

  it('falls back to the static hero when nothing is usable', () => {
    expect(pickHero([{ ...good, image: 'http://res.cloudinary.com/x.jpg' }])).toEqual(HERO_FALLBACK);
    expect(pickHero([])).toEqual(HERO_FALLBACK);
    expect(pickHero(null)).toEqual(HERO_FALLBACK);
    expect(pickHero('nope')).toEqual(HERO_FALLBACK);
  });

  it('static fallback has neutral copy and a local image', () => {
    expect(HERO_FALLBACK.source).toBe('fallback');
    expect(HERO_FALLBACK.title).toBe('Fresh flowers, arranged with care.');
    expect(HERO_FALLBACK.image.startsWith('/images/')).toBe(true);
    expect(HERO_FALLBACK.href).toBe('/products');
    expect(JSON.stringify(HERO_FALLBACK)).not.toMatch(/same-day|free delivery|hours/i);
  });

  it('replaces unsafe hrefs with /products', () => {
    for (const href of ['https://evil.example/x', '//evil.example', 'javascript:alert(1)', '/\\evil', '', undefined]) {
      expect(pickHero([{ ...good, href }]).href).toBe('/products');
    }
    expect(pickHero([{ ...good, href: '/occasions/birthday?x=1' }]).href).toBe('/occasions/birthday?x=1');
  });

  it('caps text lengths', () => {
    const h = pickHero([{ ...good, title: 'T'.repeat(300), subtitle: 'S'.repeat(500), eyebrow: 'E'.repeat(200), alt: 'A'.repeat(500) }]);
    expect(h.title.length).toBeLessThanOrEqual(80);
    expect(h.subtitle!.length).toBeLessThanOrEqual(200);
    expect(h.eyebrow!.length).toBeLessThanOrEqual(40);
    expect(h.alt.length).toBeLessThanOrEqual(140);
  });

  it('defaults alt to the title', () => {
    expect(pickHero([{ ...good, alt: null }]).alt).toBe('Spring in bloom');
  });
});

describe('safeHref', () => {
  it('allows the site origin and returns a relative path', () => {
    expect(safeHref('https://freshpetalsindia.com/products?x=1', 'https://freshpetalsindia.com')).toBe('/products?x=1');
    expect(safeHref('https://other.com/products', 'https://freshpetalsindia.com')).toBe('/products');
  });
});
