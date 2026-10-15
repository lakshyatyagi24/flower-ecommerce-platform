import { test as base, expect } from '@playwright/test';
import { isAllowedUrl } from './host-guard';

export { expect };

/**
 * Every spec imports `test` from here. Each browser context gets a request firewall:
 * anything aimed at the production domain (or any host outside the allowlist) is aborted and recorded, and the
 * test FAILS if even one such request was attempted. This covers the case the URL checks cannot: a storefront
 * build whose baked-in API base points somewhere else, so the browser itself would send writes there.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    const blocked: string[] = [];
    const allowHost = process.env.E2E_ALLOW_HOST;

    await context.route('**/*', (route) => {
      const url = route.request().url();
      if (!/^https?:/i.test(url) || isAllowedUrl(url, allowHost)) return route.fallback();
      blocked.push(url);
      return route.abort();
    });
    // Belt and braces: registered last, so it runs first for the production domain whatever the allowlist says.
    await context.route(/freshpetalsindia\.com/i, (route) => {
      blocked.push(route.request().url());
      return route.abort();
    });

    await use(context);

    expect(blocked, 'requests to non-allowlisted hosts were attempted (and blocked)').toEqual([]);
  },
});
