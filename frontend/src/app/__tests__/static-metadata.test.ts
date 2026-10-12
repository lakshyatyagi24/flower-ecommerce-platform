import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/server-api', () => ({}));

/* eslint-disable @typescript-eslint/no-explicit-any */
const routes: Record<string, () => Promise<{ metadata: any }>> = {
  '/': () => import('../page'),
  '/about': () => import('../about/layout'),
  '/contact': () => import('../contact/layout'),
  '/corporate': () => import('../corporate/layout'),
  '/faq': () => import('../faq/layout'),
  '/privacy': () => import('../privacy/layout'),
  '/terms': () => import('../terms/layout'),
  '/refund-policy': () => import('../refund-policy/layout'),
  '/track-order': () => import('../track-order/layout'),
  '/track-order/results': () => import('../track-order/results/layout'),
  '/checkout': () => import('../checkout/layout'),
  '/checkout/success': () => import('../checkout/success/layout'),
  '/account/login': () => import('../account/login/layout'),
  '/account/register': () => import('../account/register/layout'),
  '/account/orders': () => import('../account/orders/layout'),
};
const noindex = ['/track-order', '/track-order/results', '/checkout', '/checkout/success', '/account/login', '/account/register', '/account/orders'];

describe('static route metadata', () => {
  it('every route has a unique, bounded title and description and a canonical', async () => {
    const titles = new Set<string>();
    const descs = new Set<string>();
    for (const [path, load] of Object.entries(routes)) {
      const { metadata: m } = await load();
      const title: string = typeof m.title === 'string' ? m.title : m.title?.absolute ?? m.title?.default;
      expect(title, path).toBeTruthy();
      expect(title.length, `${path} title`).toBeLessThanOrEqual(60);
      expect(m.description, path).toBeTruthy();
      expect(m.description.length, `${path} description`).toBeLessThanOrEqual(155);
      expect(m.alternates?.canonical, path).toBe(path);
      expect(titles.has(title), `dup title ${title}`).toBe(false);
      expect(descs.has(m.description), `dup desc ${path}`).toBe(false);
      titles.add(title);
      descs.add(m.description);
      if (noindex.includes(path)) expect(m.robots?.index, path).toBe(false);
      else expect(m.robots?.index, path).not.toBe(false);
    }
  }, 60000); // imports every page module (home pulls the whole component tree)
});

describe('FAQ structured data source', () => {
  it('has questions and feeds a valid FAQPage', async () => {
    const { allFaqItems } = await import('../faq/faq-data');
    const { faqJsonLd } = await import('@/lib/seo');
    expect(allFaqItems.length).toBeGreaterThan(5);
    expect(allFaqItems.every((i) => i.q && i.a)).toBe(true);
    expect((faqJsonLd(allFaqItems) as { mainEntity: unknown[] }).mainEntity).toHaveLength(allFaqItems.length);
  });
});
