import { describe, it, expect } from 'vitest';
import robots from '../robots';

describe('robots', () => {
  const r = robots();
  const rule = (Array.isArray(r.rules) ? r.rules[0] : r.rules) as { userAgent: string; allow: string; disallow: string[] };

  it('allows the site and blocks private/utility areas', () => {
    expect(rule.userAgent).toBe('*');
    expect(rule.allow).toBe('/');
    expect(rule.disallow).toEqual(['/checkout', '/account', '/track-order', '/search', '/design-preview', '/api']);
  });

  it('points at the absolute sitemap and omits host', () => {
    expect(r.sitemap).toBe('https://freshpetalsindia.com/sitemap.xml');
    expect(r.host).toBeUndefined();
  });
});
