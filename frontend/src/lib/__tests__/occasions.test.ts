import { describe, it, expect } from 'vitest';
import { OCCASIONS, getOccasion, occasionForTag } from '../occasions';

// Unverifiable claims must never appear in editorial copy (ruling R10).
const BANNED = ['same-day', 'same day', 'free delivery', 'guarantee', 'award', 'rated', 'within', 'minutes', 'hours'];
const BRAND_SUFFIX = ' · Fresh Petals India'; // layout title template
const words = (s: string) => s.trim().split(/\s+/).length;

describe('OCCASIONS', () => {
  it('has the 8 expected occasions with unique slugs and tag === slug', () => {
    expect(OCCASIONS.map((o) => o.slug)).toEqual([
      'birthday', 'anniversary', 'wedding', 'corporate', 'sympathy', 'congratulations', 'get-well-soon', 'just-because',
    ]);
    expect(new Set(OCCASIONS.map((o) => o.slug)).size).toBe(8);
    for (const o of OCCASIONS) expect(o.tag).toBe(o.slug);
  });

  it.each(OCCASIONS.map((o) => [o.slug, o] as const))('%s: title, description and intro are within limits', (_s, o) => {
    expect(o.title.length).toBeLessThanOrEqual(60);
    expect(o.title.length + BRAND_SUFFIX.length).toBeLessThanOrEqual(60); // total <title> stays within 60
    expect(o.metaDescription.length).toBeGreaterThan(60);
    expect(o.metaDescription.length).toBeLessThanOrEqual(155);
    expect(words(o.intro)).toBeGreaterThanOrEqual(80);
    expect(words(o.intro)).toBeLessThanOrEqual(120);
    expect(o.name.length).toBeGreaterThan(2);
  });

  it('contains no banned claim words anywhere in the copy', () => {
    for (const o of OCCASIONS) {
      const all = `${o.title} ${o.metaDescription} ${o.intro} ${o.eyebrow ?? ''}`.toLowerCase();
      for (const b of BANNED) expect(all, `${o.slug} contains "${b}"`).not.toContain(b);
    }
  });

  it('has unique titles and intros', () => {
    expect(new Set(OCCASIONS.map((o) => o.title)).size).toBe(8);
    expect(new Set(OCCASIONS.map((o) => o.intro)).size).toBe(8);
  });

  it('getOccasion / occasionForTag look up by slug and tag', () => {
    expect(getOccasion('birthday')?.name).toBe('Birthday');
    expect(getOccasion('nope')).toBeUndefined();
    expect(getOccasion('__proto__')).toBeUndefined();
    expect(occasionForTag('get-well-soon')?.slug).toBe('get-well-soon');
    expect(occasionForTag('x')).toBeUndefined();
  });
});
